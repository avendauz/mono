import {eventListener, eventListenerOnce, Msg, sendEvent, sendEventPartial} from "@scottburch/rxjs-msg-bus";
import {concatMap, from, map, switchMap, take, tap, toArray} from "rxjs";
import {NodeConfig, Node, NodeStartMsg, NodeStartedMsg, NodeStopMsg, NodeStoppedMsg} from '@libertynet/core'

export type Swarm = {
    nodes: Node[]
}

export type TestSwarmStartMsg = Msg<'test.swarm-start', {
    nodeConfigs: NodeConfig[]
}>

export type TestSwarmStartedMsg = Msg<'test.swarm-started', Swarm>
export type TestSwarmStopMsg = Msg<'test.swarm-stop', Swarm>
export type TestSwarmStoppedMsg = Msg<'test.swarm-stopped', Swarm>

// start a swarm
eventListener<TestSwarmStartMsg>('test.swarm-start').pipe(
    concatMap(({nodeConfigs}) => from(nodeConfigs).pipe(
        tap(config => sendEvent<NodeStartMsg>('node.start', config)),
        concatMap(() => eventListenerOnce<NodeStartedMsg>('node.started')),
        take(nodeConfigs.length),
        toArray(),
        map(nodes => ({nodes})),
        tap(sendEventPartial<TestSwarmStartedMsg>('test.swarm-started'))
    ))
).subscribe();

// stop a swarm
eventListener<TestSwarmStopMsg>('test.swarm-stop').pipe(
    switchMap(swarm => from(swarm.nodes).pipe(
        tap(node => sendEvent<NodeStopMsg>('node.stop', node)),
        switchMap(() => eventListenerOnce<NodeStoppedMsg>('node.stopped')),
        take(swarm.nodes.length),
        toArray(),
        tap(() => sendEvent<TestSwarmStoppedMsg>('test.swarm-stopped', swarm))
    )),
).subscribe()







