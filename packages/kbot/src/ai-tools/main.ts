#!/usr/bin/env node
import { commands } from './commands/index.js'
import { logger } from './index.js'
import cli from 'yargs'
import { hideBin } from 'yargs/helpers'
const yargs = cli(hideBin(process.argv))

async function main() {
    try {
        const argv = await commands(yargs).argv
    } catch (error) {
        logger.error('Error executing command:', error);
        process.exit(1);
    }
}
main()