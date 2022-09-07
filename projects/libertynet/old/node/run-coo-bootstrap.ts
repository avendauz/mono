#!/usr/bin/env ts-node

import * as fs from 'fs-extra'
import {exec} from '@scottburch/exec'
import {privateKeys, secretConfig} from "./secret.data";
import {createSnapshot} from "./create-snapshot";
import {ProcessPromise} from "@scottburch/exec";

process.argv[1] === __filename && setTimeout(() => runCooBootstrap());

export const runCooBootstrap = (): Promise<{node: ProcessPromise<string>}> =>
    new Promise((resolve, reject) => {
                createSnapshot()
                    .then(() => fs.mkdirs(`${__dirname}/data`))
                    .then(() => Promise.all([
                        fs.rm(`${__dirname}/data/p2pstore`, {force: true, recursive: true}),
                        fs.rm(`${__dirname}/data/privatedb`, {force: true, recursive: true}),
                        fs.rm(`${__dirname}/data/coordinator.state`, {force: true}),
                        fs.rm(`${__dirname}/data/coordinator.state_old`, {force: true})
                    ]))
                    .then(() => {
                        const ex = exec`${__dirname}/hornet ${getOptions()}`;
                        resolve({node: ex})
                    })
                    .catch((e: any) => reject(e))
    })

const getOptions = () => [
    ...secretConfig,
    '-c', `${__dirname}/config_libertynet_tangle.json`,
    `--coordinator.stateFilePath=${__dirname}/data/coordinator.state`,
    '--cooBootstrap',
    '--cooStartIndex', '0',
    '--protocol.networkID=libertynet',
    '--restAPI.bindAddress=0.0.0.0:14265',
    '--dashboard.bindAddress=localhost:8081',
    `--db.path=${__dirname}/data/privatedb`,
    '--node.disablePlugins=Autopeering',
    '--node.enablePlugins=Spammer,Coordinator,MQTT,Debug,Prometheus,Faucet',
    `--snapshots.fullPath=${__dirname}/data/snapshots/full_snapshot.bin`,
    `--snapshots.deltaPath=${__dirname}/data/snapshots/delta_snapshot.bin`,
    '--p2p.bindMultiAddresses=/ip4/127.0.0.1/tcp/15600',
    '--profiling.bindAddress=127.0.0.1:6060',
    '--prometheus.bindAddress=localhost:9311',
    '--prometheus.fileServiceDiscovery.target=localhost:9311',
    '--mqtt.bindAddress=localhost:1883',
    `--p2p.db.path=${__dirname}/data/p2pstore`,
    `--p2p.identityPrivateKey=${privateKeys.p2p[0]}`,
    '--p2p.peers=/ip4/127.0.0.1/tcp/15601/p2p/12D3KooWCKwcTWevoRKa2kEBputeGASvEBuDfRDSbe8t1DWugUmL,/ip4/127.0.0.1/tcp/15602/p2p/12D3KooWGdr8M5KX8KuKaXSiKfHJstdVnRkadYmupF7tFk2HrRoA,/ip4/127.0.0.1/tcp/15603/p2p/12D3KooWC7uE9w3RN4Vh1FJAZa8SbE8yMWR6wCVBajcWpyWguV73'
]