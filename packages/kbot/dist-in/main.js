#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { toYargs } from '@polymech/commons';
import { createLogger } from '@polymech/log';
import { OptionsSchema, schemas, types } from './zod_schema.js';
import helpCommand from './commands/help.js';
import { examples } from './commands/examples.js';
import { init } from './commands/init.js';
import { build } from './commands/build.js';
import { fetch } from './commands/fetch.js';
import { run } from './commands/run.js';
import { transcribeCommand, TranscribeOptionsSchema } from './commands/transcribe.js';
import { imageCommand, ImageOptionsSchema } from './commands/images.js';
import { ttsCommand, TTSOptionsSchema } from './commands/tts.js';
export const logger = createLogger('llm-tools');
const modify = async (argv) => await run(argv);
const yargOptions = {
    onKey: ((_yargs, key, options) => {
        switch (key) {
            case 'prompt':
                {
                    return _yargs.positional(key, options);
                }
            case 'include':
                {
                    return _yargs.option(key, { ...options, alias: key[0].toLowerCase() });
                }
        }
    })
};
yargs(hideBin(process.argv))
    .command('init', 'Initialize KBot configuration', (yargs) => toYargs(yargs, OptionsSchema(), yargOptions), init)
    .command('modify [prompt]', 'Modify an existing project', (yargs) => toYargs(yargs, OptionsSchema(), yargOptions), modify)
    .command('image [prompt]', 'Create or edit an image', (yargs) => toYargs(yargs, ImageOptionsSchema(), yargOptions), imageCommand)
    .command('transcribe', 'Transcribe audio files', (yargs) => toYargs(yargs, TranscribeOptionsSchema(), yargOptions), transcribeCommand)
    .command('tts', 'Convert text to speech using ElevenLabs', (yargs) => toYargs(yargs, TTSOptionsSchema(), yargOptions), ttsCommand)
    .command('types', 'Generate types', (yargs) => { }, (argv) => types())
    .command('schemas', 'Generate schemas', (yargs) => { }, (argv) => schemas())
    .command('build', 'Build kbot essentials', (yargs) => { }, (argv) => build())
    .command('fetch', "Fetch models, to $HOME/.kbot/", (yargs) => { }, (argv) => fetch())
    .command('help-md', 'Generate markdown help', (yargs) => { }, helpCommand)
    .command('examples', 'Show examples', (yargs) => { }, examples)
    .command(['modify [prompt]', '$0'], 'Default command modify', (yargs) => toYargs(yargs, OptionsSchema(), yargOptions), modify)
    .help()
    //.wrap(yargs.terminalWidth() - 20)
    .parse();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEtBQUssTUFBTSxPQUFPLENBQUE7QUFDekIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGVBQWUsQ0FBQTtBQUN2QyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDM0MsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGVBQWUsQ0FBQTtBQUU1QyxPQUFPLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUcvRCxPQUFPLFdBQVcsTUFBTSxvQkFBb0IsQ0FBQTtBQUM1QyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFDakQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQ3pDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUMzQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDM0MsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRXZDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDBCQUEwQixDQUFBO0FBQ3JGLE9BQU8sRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUN2RSxPQUFPLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFFaEUsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUFRLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUVwRCxNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsSUFBZSxFQUFFLEVBQUUsQ0FBRSxNQUFNLEdBQUcsQ0FBQyxJQUFpQixDQUFDLENBQUE7QUFFdkUsTUFBTSxXQUFXLEdBQVE7SUFDdkIsS0FB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