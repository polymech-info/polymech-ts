#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { toYargs } from '@polymech/commons'
import { createLogger } from '@polymech/log'

import { OptionsSchema, schemas, types } from './zod_schema.js'
import { IKBotTask } from './ai-tools/index.js'

import helpCommand from './commands/help.js'
import { examples } from './commands/examples.js'
import { init } from './commands/init.js'
import { build } from './commands/build.js'
import { fetch } from './commands/fetch.js'
import { run } from './commands/run.js'

import { transcribeCommand, TranscribeOptionsSchema } from './commands/transcribe.js'
import { imageCommand, ImageOptionsSchema } from './commands/images.js'
import { ttsCommand, TTSOptionsSchema } from './commands/tts.js'

export const logger: any = createLogger('llm-tools')

const modify = async (argv: IKBotTask) =>  await run(argv as IKBotTask)

const yargOptions: any = {
  onKey: ((_yargs, key, options) => {
    switch (key) {
      case 'prompt':
        {
          return _yargs.positional(key, options)
        }
      case 'include':
        {
          return _yargs.option(key, {...options, alias: key[0].toLowerCase()})
        }
    }
  })
}

yargs(hideBin(process.argv))
  .command(
    'init',
    'Initialize KBot configuration',
    (yargs) => toYargs(yargs, OptionsSchema(), yargOptions),
    init
  )
  .command(
    'modify [prompt]',
    'Modify an existing project',
    (yargs) => toYargs(yargs, OptionsSchema(), yargOptions),
    modify
  )
  .command(
    'image [prompt]',
    'Create or edit an image',
    (yargs) => toYargs(yargs, ImageOptionsSchema(), yargOptions),
    imageCommand
  )
  .command(
    'transcribe',
    'Transcribe audio files',
    (yargs) => toYargs(yargs, TranscribeOptionsSchema(), yargOptions),
    transcribeCommand
  )
  .command(
    'tts',
    'Convert text to speech using ElevenLabs',
    (yargs) => toYargs(yargs, TTSOptionsSchema(), yargOptions),
    ttsCommand
  )
  .command(
    'types',
    'Generate types',
    (yargs) => { },
    (argv) => types()
  )
  .command(
    'schemas',
    'Generate schemas',
    (yargs) => { },
    (argv) => schemas()
  )
  .command(
    'build',
    'Build kbot essentials',
    (yargs) => { },
    (argv) => build()
  )
  .command(
    'fetch',
    "Fetch models, to $HOME/.kbot/",
    (yargs) => { },
    (argv) => fetch()
  )
  .command(
    'help-md',
    'Generate markdown help',
    (yargs) => { },
    helpCommand
  )
  .command(
    'examples',
    'Show examples',
    (yargs) => { },
    examples
  )
  .command(['modify [prompt]', '$0'], 'Default command modify',
    (yargs) => toYargs(yargs, OptionsSchema(), yargOptions), modify)
  .help()
  //.wrap(yargs.terminalWidth() - 20)
  .parse()