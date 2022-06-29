import {IIndexationPayload, IMessage, INDEXATION_PAYLOAD_TYPE, ITypeBase, SingleNodeClient} from "@iota/iota.js";
import {eventListener, eventListenerOnce, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {AppStartMsg, AppStopMsg} from "@libertynet/app";
import {concatMap, count, filter, from, map, pipe, switchMap, takeUntil, tap, withLatestFrom,} from 'rxjs'
import {memoize, partial} from "lodash";
import {Converter} from "@iota/util.js";
import {Buffer} from "buffer";
import {
    CheckNewMilestoneMsg,
    ClientConnectedMsg,
    MilestoneDetectionErrorMsg,
    NewIotaMessageIdMsg,
    NewLibertynetMessageMsg,
    NewMilestoneDetectedMsg,
    SendIotaMessageAction,
    SendLibertynetMessageAction
} from "./messages";
import {switchToLatestFrom} from "@scottburch/rxjs-utils";
import {buildKey, bytesToNum, numToBytes, readFromDb} from "@libertynet/db";
import {AppReadyMsg} from "@libertynet/app/src/app";
import {DbWriteAction} from "@libertynet/db/src/db";


const getLastMilestoneReadKey = memoize(() => buildKey('libertynet', 'iota', 'last-milestone-read'));

// start poll ticker
eventListener<AppReadyMsg>('app-ready').pipe(
    switchMap(() => eventListenerOnce<ClientConnectedMsg>('client-connected').pipe(
        takeUntil(eventListenerOnce<AppStopMsg>('app-stop')),
        map(() => ({key: getLastMilestoneReadKey()})),
        readFromDb(),
        map(bytesToNum),
        map(partial(Math.max, 1)),
        tap(startMilestone => sendEvent<CheckNewMilestoneMsg>('check-new-milestone', startMilestone))
    )),
).subscribe();

eventListener<CheckNewMilestoneMsg>('check-new-milestone').pipe(
    takeUntil(eventListenerOnce<AppStopMsg>('app-stop')),
    map(index => ({
        key: getLastMilestoneReadKey(),
        value: numToBytes(index)
    })),
    tap(sendEventPartial<DbWriteAction>('write-to-db'))
).subscribe();


// connect iota client
eventListener<AppReadyMsg>('app-ready').pipe(
    map(({nodeUrl}) => newIotaClient(nodeUrl)),
    tap(sendEventPartial<ClientConnectedMsg>('client-connected'))
).subscribe()


// detect new milestones
eventListener<AppStartMsg>('app-start').pipe(
    switchMap(() => eventListener<CheckNewMilestoneMsg>('check-new-milestone').pipe(
        takeUntil(eventListenerOnce<AppStopMsg>('app-stop')),
        withLatestFrom(eventListener<ClientConnectedMsg>('client-connected')),
        concatMap(([index, client]) =>
            client.milestone(index)
                .then(m => sendEvent<NewMilestoneDetectedMsg>('new-milestone-detected', m))
                .catch(err => {
                    sendEvent<MilestoneDetectionErrorMsg>('milestone-detection-error', err.toString());
                    setTimeout(() => sendEvent<CheckNewMilestoneMsg>('check-new-milestone', index), 2000)
                })
        ),
    ))
).subscribe()

// detect new milestone connected messages
eventListener<NewMilestoneDetectedMsg>('new-milestone-detected').pipe(
    withLatestFrom(eventListener<ClientConnectedMsg>('client-connected')),
    concatMap(([milestone, client]) => client.message(milestone.messageId).then(ms => ({
        index: milestone.index,
        milestone: ms
    }))),
    concatMap(({index, milestone}) => from(milestone.parentMessageIds as string[]).pipe(
        filterOutGenesisParent(),
        filterOutPreviousMessageIds(),
        tap(sendEventPartial<NewIotaMessageIdMsg>('new-iota-message-id')),
        count()
    )),
    switchToLatestFrom(eventListener<CheckNewMilestoneMsg>('check-new-milestone')),
    tap(index => sendEvent<CheckNewMilestoneMsg>('check-new-milestone', index + 1))
).subscribe();

// read back in the graph to find new messages
eventListener<NewIotaMessageIdMsg>('new-iota-message-id').pipe(
    withLatestFrom(eventListener<ClientConnectedMsg>('client-connected')),
    concatMap(([messageId, client]) => client.messageMetadata(messageId)),
    switchMap(meta => from(meta.parentMessageIds as string[])),
    filterOutGenesisParent(),
    filterOutPreviousMessageIds(),
    tap(sendEventPartial<NewIotaMessageIdMsg>('new-iota-message-id')),
).subscribe();

// read newly discovered mesages
eventListener<NewIotaMessageIdMsg>('new-iota-message-id').pipe(
    withLatestFrom(eventListener<ClientConnectedMsg>('client-connected')),
    concatMap(([messageId, client]) => client.message(messageId)),
    filterForLibertynetMessage(),
    map(msg => (msg.payload as IIndexationPayload).data || ''),
    tap(sendEventPartial<NewLibertynetMessageMsg>('new-libertynet-message'))
).subscribe();

// send an iota message
eventListener<SendIotaMessageAction>('send-iota-message').pipe(
    withLatestFrom(eventListener<ClientConnectedMsg>('client-connected')),
    map(([msg, client]) => ({msg, client})),
    concatMap(ctx => from(ctx.client.tips()).pipe(
        map(tips => ({...ctx, msg: {...ctx.msg, parentMessageIds: tips.tipMessageIds.slice(0, 2)}}))
    )),
    tap(ctx => ctx.client.messageSubmit(ctx.msg))
).subscribe();


eventListener<SendLibertynetMessageAction>('send-libertynet-message').pipe(
    tap((hex: string) => sendEvent<SendIotaMessageAction>('send-iota-message', {
        payload: {
            type: INDEXATION_PAYLOAD_TYPE,
            index: Converter.utf8ToHex(`libertynet`),
            data: hex
        }
    }))
).subscribe();

/**
 * UTILITIES
 */
export const newIotaClient = (url: string = 'http://localhost:14265') => new SingleNodeClient(url);

const previousMessageIds: Record<string, { timestamp: number }> = {}

function filterOutPreviousMessageIds() {
    return pipe(
        filter((id: string) => !previousMessageIds[id]),
        tap(id => previousMessageIds[id] = {timestamp: Date.now()})
    )
}


function filterForLibertynetMessage() {
    return pipe(
        filter((msg: IMessage) => (msg.payload as ITypeBase<number>).type === 2 && (msg.payload as IIndexationPayload).index.includes(getLibertynetIndex())),
    )
}

const getLibertynetIndex = (memoize(() => Buffer.from('libertynet').toString('hex')));


function filterOutGenesisParent() {
    return pipe(
        filter((msgId: string) => !/^0*$/.test(msgId)),
    );
}