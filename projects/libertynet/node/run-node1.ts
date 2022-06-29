#!/usr/bin/env ts-node
import {runNode} from "./run-node"
import {privateKeys} from "./secret.data";

runNode({offset: 1, p2pKey: privateKeys.p2p[1]});

