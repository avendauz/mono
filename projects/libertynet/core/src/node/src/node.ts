import {
    eventListener,
    eventListenerMatchOnce,
    Msg,
    sendEvent,
    sendEventPartial
} from "@scottburch/rxjs-msg-bus";
import {concatMap, map, of, tap, takeUntil, switchMap} from "rxjs";
import {P2p, P2pConfig} from "../../p2p/src/p2p";
import {AppStartMsg} from "../../app/src/app";
import {P2pCreatedMsg, P2pCreateMsg, P2pStartedMsg, P2pStartMsg, P2pStopMsg, P2pStoppedMsg} from "../../p2p/src/p2p";

export type Node = {
    moniker: string
    p2p: P2p
}

export type NodeConfig = {
    moniker: string
    p2pConfig: Omit<P2pConfig, 'moniker'>
}

export type NodeStartMsg = Msg<'node.start', NodeConfig>
export type NodeStopMsg = Msg<'node.stop', Node>
export type NodeStoppedMsg = Msg<'node.stopped', Node>
export type NodeStartedMsg = Msg<'node.started', Node>

eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<NodeStartMsg>('node.start').pipe(
        takeUntil(eventListener('app.stop')),
    )),
    concatMap(config => startNode(config)),
    tap(node => sendEvent<NodeStartedMsg>('node.started', node))
).subscribe();


eventListener<AppStartMsg>('app.start').pipe(
    switchMap(() => eventListener<NodeStopMsg>('node.stop').pipe(
        takeUntil(eventListener('app.stop')),
    )),
    tap(node => sendEvent<P2pStopMsg>('p2p.stop', node.p2p)),
    concatMap(node => eventListenerMatchOnce<P2pStoppedMsg>('p2p.stopped', p2p => p2p.moniker === node.moniker).pipe(
        map(() => node)
    )),
    tap(sendEventPartial<NodeStoppedMsg>('node.stopped'))
).subscribe()

const startNode = (config: NodeConfig) =>
    of(config).pipe(
        tap(config => sendEvent<P2pCreateMsg>('p2p.create', {...config.p2pConfig, moniker: config.moniker})),
        concatMap(config => eventListenerMatchOnce<P2pCreatedMsg>('p2p.created', p2p => p2p.moniker === config.moniker)),
        tap(sendEventPartial<P2pStartMsg>('p2p.start')),
        concatMap(p2pIn => eventListenerMatchOnce<P2pStartedMsg>('p2p.started', p2p => p2p.moniker === p2pIn.moniker)),
        map(p2p => ({
            moniker: p2p.moniker, p2p
        }))
    )