import {runCooBootstrap} from '@libertynet/node/run-coo-bootstrap'
import {exec, ProcessPromise} from '@scottburch/exec'
import {runNode} from "@libertynet/node/run-node";
import {privateKeys} from "@libertynet/node/secret.data";
import delay from 'delay'

export type Swarm = Record<string, ProcessPromise<string>>

export const stopHornet = () =>
    exec`killall hornet`
        .then(() => delay(5000));

export const startSwarm = () => {
    const swarm:Swarm  = {};
    return stopHornet()
        .then(() => {
            runCooBootstrap()
                .then(p => {
                    swarm.coo = p.node
                })
                .then(() => runNode({offset: 1, p2pKey: privateKeys.p2p[1]}))
                .then(p => {
                    swarm.node1 = p.node
                })
                .then(() => runNode({offset: 2, p2pKey: privateKeys.p2p[2]}))
                .then(p => {
                    swarm.node2 = p.node
                })
        })
        .then(() => delay(5000))   // TODO: make this deterministic
        .then(() => swarm);
};

export const stopSwarm = (swarm: Swarm) =>
    Promise.all(Object.values(swarm).map(s => s.kill())).then(() => delay(5000));



