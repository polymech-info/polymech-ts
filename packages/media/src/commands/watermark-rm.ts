import { CONFIG_DEFAULT } from '@polymech/commons'
import * as CLI from 'yargs'
import { logger } from '../index.js'
import {
  watermark
} from '../lib/media/images/watermark.js'

import {
  sanitize,
  defaults
} from '../_cli.js'

import {
  IOptions
} from '../types.js'

export const defaultOptions = (yargs: CLI.Argv) => {
  return yargs.option('src', {
    describe: 'FILE|FOLDER|GLOB',
    demandOption: true
  }).option('dst', {
    describe: 'FILE|FOLDER|GLOB'
  }).option('debug', {
    default: false,
    describe: 'Enable internal debug messages',
    type: 'boolean'
  }).option('alt', {
    default: false,
    describe: 'Use alternate tokenizer, & instead of $',
    type: 'boolean'
  }).option('dry', {
    default: false,
    describe: 'Run without conversion',
    type: 'boolean'
  }).option('verbose', {
    default: false,
    describe: 'Show internal messages',
    type: 'boolean'
  }).option('percent', {
    default: false,
    describe: 'Resize image with percent',
    type: 'number'
  }).option('width', {
    default: false,
    describe: 'Resize image with',
    type: 'number'
  }).option('height', {
    default: false,
    describe: 'Resize image height',
    type: 'number'
  }).option('minHeight', {
    describe: 'Resize image minimum height',
    type: 'number'
  }).option('minWidth', {
    describe: 'Resize image minimum width',
    type: 'number'
  }).option('minSize', {
    describe: 'Resize image size (bytes)',
    type: 'number'
  }).option('percent', {
    describe: 'Resize image in percent (width)',
    type: 'number'
  }).option('key', {
    describe: 'API Key',
    type: 'string'
  })
}

const options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
  return cli.command('watermark', 'Remove watermark : FILE|GLOB', options, async (argv: CLI.Arguments) => {
    defaults()
    const options = sanitize(argv) as IOptions
    const config: any = CONFIG_DEFAULT()
    if (!config.novita) {
      logger.error("Novita key not found");
      return
    }
    options.debug && logger.info("Watermark Options " + argv.dst, options)
    return watermark({ ...options, key: config.novita.key })
  })
}
