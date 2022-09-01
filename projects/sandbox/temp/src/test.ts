import {P2p} from '@libertynet/p2p'
import {calculateMsgHash} from '@libertynet/dag'
import {DagMessage} from "@libertynet/dag";

const x: P2p = {} as P2p

calculateMsgHash({
    id: new Uint8Array,
    parentIds: [new Uint8Array()],
    payload: new Uint8Array(),
    sig: {
        pubKey: new Uint8Array(),
        signature: new Uint8Array()
    },
    type: 'testing',
    sequence: 1,
    version: 1,
    timestamp: Date.now()
} as DagMessage).subscribe(console.log)