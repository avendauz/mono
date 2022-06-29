import {eventListener, Msg, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {map, tap} from "rxjs";

import express, {Express} from "express";
import bodyParser from "body-parser";
import {JSONRPCServer} from "json-rpc-2.0";
import {Server} from "http";
import {SimpleJSONRPCMethod} from "json-rpc-2.0/dist/server";


type RpcServer = {
    jsonRpcServer: JSONRPCServer,
    rpcPort: number,
    app: Express,
    httpServer: Server
}

export type RpcCreateServerMsg = Msg<'rpc.create-server', { rpcPort: number }>
export type RpcServerCreatedMsg = Msg<'rpc.server-created', Omit<RpcServer, 'httpServer'>>
export type RpcServerStartMsg = Msg<'rpc.server-start', Omit<RpcServer, 'httpServer'>>
export type RpcServerStartedMsg = Msg<'rpc.server-started', RpcServer>
export type RpcServerStopMsg = Msg<'rpc.server-stop', RpcServer>
export type RpcServerStoppedMsg = Msg<'rpc.server-stopped', RpcServer>
export type RpcServerAddMethod = Msg<'rpc.server-add-method', { rpcServer: Omit<RpcServer, 'httpServer'>, cmd: string, method: SimpleJSONRPCMethod<unknown> }>

eventListener<RpcCreateServerMsg>('rpc.create-server').pipe(
    map(({rpcPort}) => ({app: express(), rpcPort})),
    tap(({app}) => app.use(bodyParser.json())),
    tap(({rpcPort, app}) => sendEvent<RpcServerCreatedMsg>('rpc.server-created', {
        jsonRpcServer: new JSONRPCServer(),
        rpcPort,
        app
    }))
).subscribe();

eventListener<RpcServerCreatedMsg>('rpc.server-created').pipe(
    tap(({app, jsonRpcServer}) => {
        app.post("/json-rpc", (req: any, res: any) => {
            const jsonRPCRequest = req.body;
            // server.receive takes a JSON-RPC request and returns a promise of a JSON-RPC response.
            // It can also receive an array of requests, in which case it may return an array of responses.
            // Alternatively, you can use server.receiveJSON, which takes JSON string as is (in this case req.body).
            jsonRpcServer.receive(jsonRPCRequest).then((jsonRPCResponse) => {
                if (jsonRPCResponse) {
                    res.json(jsonRPCResponse);
                } else {
                    // If response is absent, it was a JSON-RPC notification method.
                    // Respond with no content status (204).
                    res.sendStatus(204);
                }
            });
        });
    })
).subscribe()

eventListener<RpcServerStartMsg>('rpc.server-start').pipe(
    map((rpcServer) => ({...rpcServer, httpServer: rpcServer.app.listen(rpcServer.rpcPort)})),
    tap(sendEventPartial<RpcServerStartedMsg>('rpc.server-started'))
).subscribe();

eventListener<RpcServerStopMsg>('rpc.server-stop').pipe(
    tap((rpcServer) => rpcServer.httpServer.close(() =>
        sendEvent<RpcServerStoppedMsg>('rpc.server-stopped', rpcServer)
    ))
).subscribe();

eventListener<RpcServerAddMethod>('rpc.server-add-method').pipe(
    tap(({rpcServer, cmd, method}) => {
        rpcServer.jsonRpcServer.addMethod(cmd, method)
    })
).subscribe()

