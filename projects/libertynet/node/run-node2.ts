#!/usr/bin/env ts-node
import {runNode} from "./run-node"
import {privateKeys} from "./secret.data";

runNode({offset: 2, p2pKey: privateKeys.p2p[2]});

