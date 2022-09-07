import {eventListener} from "@scottburch/rxjs-msg-bus";
import {P2pDialPeerMsg, P2pDialSuccessMsg, P2pPeerDiscoveredMsg, P2pStartedMsg} from "./p2p";
import {from, switchMap, tap} from "rxjs";

eventListener<P2pPeerDiscoveredMsg>('p2p.peer-discovered').pipe(
    tap(({p2p, peerId}) => console.log(`Peer discovered for ${p2p.libp2p.peerId}, peerId:${peerId}`)),
).subscribe();

eventListener<P2pStartedMsg>('p2p.started').pipe(
    tap(p2p => console.log('P2p started:', p2p.p2pId)),
    switchMap(p2p => from(p2p.libp2p.getMultiaddrs())),
    tap(addr => console.log('addr:', addr.toString()))
).subscribe();

eventListener<P2pDialPeerMsg>('p2p.dial-peer').pipe(
    tap(p2p => console.log('Dialing peer: ', p2p.p2p.p2pId, '->', p2p.peerAddr, p2p.protocol))
).subscribe();

eventListener<P2pDialSuccessMsg>('p2p.dial-success').pipe(
    tap(p2p => console.log('Peer dial success: ', p2p.p2p.p2pId, '->', p2p.peerAddr, p2p.protocol))
).subscribe();
