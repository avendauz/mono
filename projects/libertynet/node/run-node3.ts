#!/usr/bin/env ts-node
import {runNode} from "./run-node"
import {p2p} from "./secret.data";

runNode({offset: 3, p2pKey: p2p[3]});

