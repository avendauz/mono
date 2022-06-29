import {startBoatTalkNetwork} from "boat-talk";
import {newWsBridge} from "@scottburch/rxjs-msg-bus-ws-bridge";


process.argv[1] === __filename && setTimeout(() => startWsBridge());


export const startWsBridge = () => {
    startBoatTalkNetwork('ws-bridge');
    newWsBridge(5010);
}




