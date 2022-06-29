import {once} from "lodash";
import {newUdpBridge, startUdpBridge} from "@scottburch/rxjs-msg-bus-udp-bridge/lib/udp-bridge";
import {getCentralMsgBus} from "@scottburch/rxjs-msg-bus";
const UDP_PORT = 5010;


export const startBoatTalkNetwork = once((source: string) =>
    startUdpBridge(newUdpBridge(UDP_PORT, getCentralMsgBus(), source))
);





