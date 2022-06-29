import {filter, fromEvent, map, Observable, pipe, Subscription, tap} from "rxjs";
import dgram, {Socket} from "dgram";
import {memoize} from "lodash";
import {Cache} from 'memory-cache'
import {Msg, sendEvent} from "@scottburch/rxjs-msg-bus";


export type NetworkPacket = {
    event: Msg<unknown, unknown>
    source: string
}

export type UdpBridge = {
    socket: Socket
    subscription?: Subscription
    bus: Observable<NetworkPacket>
}


export const newUdpBridge = (port: number, bus: Observable<Msg<unknown, unknown>>, source: string): UdpBridge => {
    const socket = getSocket().bind(port);

    fromEvent(socket, 'message').pipe(
        socketMsgToNetworkPacket,
        filterPacketsFromMe(source),
        addToCache,
        map(packet => packet.event),
        tap(({type, data})  => sendEvent(type, data))
    ).subscribe()


    return {
        socket,
        bus: bus.pipe(
            filter(msg => !getCache().get(JSON.stringify(msg))),
            map(msg => ({event: msg, source})),
            tap(packet => sendDatagram(socket, port, packet))
        )

    }
};

const getCache = memoize(() => new Cache())


const addToCache = pipe(
    tap((packet: NetworkPacket) => getCache().put(JSON.stringify(packet.event), 'xx', 1000))
)

const filterPacketsFromMe = (source: string) => pipe(
    filter((packet: NetworkPacket) => packet.source !== source),
)

const socketMsgToNetworkPacket = pipe(
    map(x => (x as [Uint8Array])[0].toString()),
    map(x => JSON.parse(x)),
    map(x => x as NetworkPacket),
)


export const startUdpBridge = (bridge: UdpBridge) =>
    bridge.subscription = bridge.bus.subscribe();

export const stopUdpBridge = (bridge: UdpBridge) => new Promise<void>(resolve => {
    bridge.subscription?.unsubscribe();
    return bridge.socket.close(() => resolve())
});


const sendDatagram = (socket: Socket, port: number, packet: NetworkPacket) => {
    socket.send(JSON.stringify(packet), port, '224.0.0.1')
}

const getSocket = memoize(() =>
    dgram.createSocket({
        type: 'udp4',
        reuseAddr: true
    })
);


