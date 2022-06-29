import * as fs from 'fs-extra'
import {exec, ProcessPromise} from '@scottburch/exec'

export type RunNodeProps = {
    offset: number
    p2pKey: string
}

export const runNode = ({offset, p2pKey}: RunNodeProps) => {
    offset = offset || 0
    return new Promise<{node: ProcessPromise<string>}>((resolve, reject) => {
    return fs.rm(`${__dirname}/data/privatedb${offset}`, {force: true, recursive: true})
        .then(() => resolve({node: exec`${__dirname}/hornet ${getConfig(offset)} --p2p.identityPrivateKey=${p2pKey}`}))
        .catch((e: any) => reject(e))
    })
}

const getConfig = (offset: number) => [
    '-c', `${__dirname}/config_libertynet_tangle.json`,
    '--protocol.networkID=libertynet',
    `--restAPI.bindAddress=0.0.0.0:${14265 + offset}`,
    `--dashboard.bindAddress=localhost:${8081 + offset}`,
    `--db.path=${__dirname}/data/privatedb${offset}`,
    '--node.enablePlugins=Spammer,MQTT,Debug,Prometheus',
    `--snapshots.fullPath=${__dirname}/data/snapshots/full_snapshot.bin`,
    `--snapshots.deltaPath=${__dirname}/data/snapshots/delta_snapshot.bin`,
    `--p2p.bindMultiAddresses=/ip4/127.0.0.1/tcp/${15600 + offset}`,
    `--profiling.bindAddress=127.0.0.1:${6060 + offset}`,
    `--prometheus.bindAddress=localhost:${9311 + offset}`,
    `--prometheus.fileServiceDiscovery.target=localhost:${9311 + offset}`,
    `--mqtt.bindAddress=localhost:${1883 + offset}`,
    `--p2p.db.path=${__dirname}/data/p2pstore${offset}`,
    '--p2p.peers=/ip4/127.0.0.1/tcp/15600/p2p/12D3KooWSi843dx6J9LZHHBqxZi3zUNiy2S5grzm62o9sfE2WgiV,/ip4/127.0.0.1/tcp/15602/p2p/12D3KooWGdr8M5KX8KuKaXSiKfHJstdVnRkadYmupF7tFk2HrRoA,/ip4/127.0.0.1/tcp/15603/p2p/12D3KooWC7uE9w3RN4Vh1FJAZa8SbE8yMWR6wCVBajcWpyWguV73'
];


