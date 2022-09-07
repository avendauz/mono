#!/usr/bin/env node -r ts-node/register   --loader=ts-node/esm    --experimental-specifier-resolution=node --no-warnings

import { Command } from 'commander';
import {generateAccount} from "@libertynet/sdk";
const program = new Command();

program
    .description('Libertynet CLI')
    .version('1,0.0');

program.command('generate-account')
    .description('generate an account')
    .action(() => {
        generateAccount()
            .then(values => console.log(JSON.stringify(values, null, '\t')))
    });

program.parse();