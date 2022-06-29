#!/usr/bin/env ts-node
import {exec} from '@scottburch/exec';

const fs = require('fs-extra');


process.argv[1] === __filename && setTimeout(() => createSnapshot());

export const createSnapshot = () =>
    fs.rm(`${__dirname}/data/snapshots`, {force: true, recursive: true})
        .then(() => fs.mkdirs(`${__dirname}/data/snapshots`))
        .then(() => exec`${__dirname}/hornet tool snap-gen ${getSnapGenOptions()}`);

const getSnapGenOptions = () => [
    '--networkID', 'libertynet',
    '--mintAddress', '60200bad8137a704216e84f8f9acfe65b972d9f4155becb4815282b03cef99fe',
    '--outputPath', `${__dirname}/data/snapshots/full_snapshot.bin`
]