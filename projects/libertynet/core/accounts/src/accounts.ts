import {eventListener, Msg, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {buildKey, readFromDb} from "@libertynet/db";
import {concatMap, filter, iif, map, of, switchMap, takeUntil, tap, first} from 'rxjs'
import {Account} from "./account";
import {AppStopMsg} from '@libertynet/app'
import {AppReadyMsg} from "@libertynet/app/src/app";
import {DbWriteAction} from "@libertynet/db/src/db";

type Hex = string;
type Address = Hex;
type PubKey = Hex;

export type EnsureAccountExistsAction = Msg<'ensure-account-exists', {
    address: Address,
    pubKey: PubKey
}>;

export type IncAcctSeq = Msg<'increment-account-seq', {
    address: Address,
    pubKey: PubKey
}>

export type AccountUpdatedMsg = Msg<'account-updated', Account>

export type AccountExistsMsg = Msg<'account-exists', Account>

export type StoreAcct = Msg<'store-account', Account>

eventListener<AppReadyMsg>('app-ready').pipe(
    concatMap(() => eventListener<EnsureAccountExistsAction>('ensure-account-exists').pipe(
        takeUntil(eventListener<AppStopMsg>('app-stop')),

        concatMap(({address, pubKey}) => of(address).pipe(
            map(address => ({
                key: buildKey('libertynet', 'account', address)
            })),

            readFromDb(),

            concatMap(value => iif(() => value.length > 0, (
                of(Account.decode(value))
            ), (
                of({
                    key: buildKey('libertynet', 'account', address),
                    value: Account.encode({pubKey, address, nextSeq: 0}).finish()
                }).pipe(
                    tap(sendEventPartial<DbWriteAction>('write-to-db')),
                    map(() => Account.fromJSON({pubKey, address, nextSeq: 0}))
                )
            ))),

            tap((acct) => sendEvent<AccountExistsMsg>('account-exists', acct))
        ))
    ))
).subscribe();

eventListener<StoreAcct>('store-account').pipe(
    map((account: Account) => ({
        key: buildKey('libertynet', 'account', account.address),
        value: Account.encode(account).finish()
    })),
    tap(sendEventPartial<DbWriteAction>('write-to-db')),
    map(({value}) => Account.decode(value)),
    tap(sendEventPartial<AccountUpdatedMsg>('account-updated'))
).subscribe()


eventListener<AppReadyMsg>('app-ready').pipe(
    switchMap(() => eventListener<IncAcctSeq>('increment-account-seq').pipe(
        takeUntil(eventListener<AppStopMsg>('app-stop')),
        concatMap(accountInfo => {
            sendEvent<EnsureAccountExistsAction>('ensure-account-exists', accountInfo)
            return eventListener<AccountExistsMsg>('account-exists').pipe(
                filter(acct => acct.address === accountInfo.address),
                tap(acct => sendEvent<StoreAcct>('store-account', {...acct, nextSeq: acct.nextSeq + 1})),
                first()
            )
        }),
        concatMap(account => eventListener<AccountUpdatedMsg>('account-updated').pipe(
            filter(acct => acct.address === account.address),
            first(),
        ))
    ))
).subscribe();




