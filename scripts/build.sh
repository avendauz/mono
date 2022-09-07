#!/bin/sh

lerna run build --stream --scope @libertynet/app
lerna run build --stream --scope @libertynet/p2p
sleep 5
lerna run build --no-sort --stream --scope @libertynet/* -- --watch