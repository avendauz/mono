import {eventListener, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {
    RpcCreateServerMsg, RpcServerAddMethod,
    RpcServerCreatedMsg,
    RpcServerStartedMsg,
    RpcServerStartMsg,
    RpcServerStopMsg,
    RpcServerStoppedMsg
} from "./rpc";
import {concatMap, tap} from "rxjs";
import {newRpcClient} from "./rpcClient";
import {expect} from 'chai';

describe('rpc server', () => {
    it('should start a rpc server', (done) => {
        sendEvent<RpcCreateServerMsg>('rpc.create-server', {rpcPort: 9999});

        eventListener<RpcServerCreatedMsg>('rpc.server-created').pipe(
            tap(rpcServer => sendEvent<RpcServerAddMethod>('rpc.server-add-method',{
                rpcServer,
                cmd: 'echo',
                method: (data: unknown) => (data as {text: string}).text
            })),
            tap(sendEventPartial<RpcServerStartMsg>("rpc.server-start"))
        ).subscribe();

        eventListener<RpcServerStartedMsg>('rpc.server-started').pipe(
            concatMap(rpcServer => newRpcClient('http://localhost:9999').request('echo', {text: 'testing'})
                .then(result =>
                    expect(result).to.equal('testing')
                )
                .then(() => rpcServer)
            ),
            tap(rpcServer => sendEvent<RpcServerStopMsg>('rpc.server-stop', rpcServer)),
        ).subscribe();

        eventListener<RpcServerStoppedMsg>('rpc.server-stopped').pipe(
            tap(() => done())
        ).subscribe()
    })
});