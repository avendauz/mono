import {eventListener, Msg, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {map, tap} from "rxjs";

import express, {Express} from "express";
import bodyParser from "body-parser";
import {JSONRPCServer} from "json-rpc-2.0";
import {Server} from "http";
import {SimpleJSONRPCMethod} from "json-rpc-2.0/dist/server";


export type RpcServer = {
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

// create rpc server
eventListener<RpcCreateServerMsg>('rpc.create-server').pipe(
    map(({rpcPort}) => ({app: express(), rpcPort})),
    tap(({app}) => app.use(bodyParser.json())),
    tap(({rpcPort, app}) => sendEvent<RpcServerCreatedMsg>('rpc.server-created', {
        jsonRpcServer: new JSONRPCServer(),
        rpcPort,
        app
    }))
).subscribe();

// start json-rpc listener
eventListener<RpcServerCreatedMsg>('rpc.server-created').pipe(
    tap(({app, jsonRpcServer}) =>
        app.post("/json-rpc", (req: any, res: any) =>
            jsonRpcServer.receive(req.body).then((jsonRPCResponse) =>
                jsonRPCResponse ? res.json(jsonRPCResponse) : res.sendStatus(204)
            )
        )
    )
).subscribe()

// start http listener after starting rpc server
eventListener<RpcServerStartMsg>('rpc.server-start').pipe(
    map((rpcServer) => ({...rpcServer, httpServer: rpcServer.app.listen(rpcServer.rpcPort)})),
    tap(sendEventPartial<RpcServerStartedMsg>('rpc.server-started'))
).subscribe();

// Stop http server if rpc server is stopped
eventListener<RpcServerStopMsg>('rpc.server-stop').pipe(
    tap((rpcServer) => rpcServer.httpServer.close(() =>
        sendEvent<RpcServerStoppedMsg>('rpc.server-stopped', rpcServer)
    ))
).subscribe();

// Add a method to the rpc server
eventListener<RpcServerAddMethod>('rpc.server-add-method').pipe(
    tap(({rpcServer, cmd, method}) => {
        rpcServer.jsonRpcServer.addMethod(cmd, method)
    })
).subscribe()

