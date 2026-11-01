import { z } from 'zod';
import * as path from 'node:path';
import { sync as write } from '@polymech/fs/write';
import { sync as exists } from '@polymech/fs/exists';
import { sync as read } from '@polymech/fs/read';

import { isString } from '@polymech/core/primitives';

import { OptionsSchema } from '../zod_schema.js';
import { generateSpeech } from '../lib/tts-elevenlabs.js';
import { getLogger } from '../index.js';
import { prompt as resolvePrompt } from '../prompt.js';
import { variables } from '../variables.js';
import { resolve } from '@polymech/commons';
// Cache for voices data
let voicesCache: any = null;

const getVoicesData = async () => {
    if (!voicesCache) {
        try {
            // Try multiple possible paths for voices.json
            const possiblePaths = [
                path.resolve('src/lib/voices.json'),
                path.resolve('lib/voices.json'),
                path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'lib', 'voices.json'),
                path.resolve(path.dirname(new URL(import.meta.url).pathname), 'lib', 'voices.json'),
            ];
            
            let voicesContent = '';
            for (const voicesPath of possiblePaths) {
                const cleanPath = process.platform === 'win32' && voicesPath.startsWith('/') 
                    ? voicesPath.substring(1) 
                    : voicesPath;
                
                if (exists(cleanPath)) {
                    voicesContent = read(cleanPath, 'string') as string;
                    break;
                }
            }
            
            if (voicesContent) {
                voicesCache = JSON.parse(voicesContent);
            } else {
                // Fallback to empty voices list if file doesn't exist
                voicesCache = { voices: [] };
            }
        } catch (error) {
            // Fallback to empty voices list if file doesn't exist
            voicesCache = { voices: [] };
        }
    }
    return voicesCache;
};

// Extract voice names and IDs for help text
const getVoicesList = async () => {
    const voicesData = await getVoicesData();
    return voicesData.voices.map((voice: any) => `${voice.name} (${voice.voice_id})`).join(', ');
};

const getVoiceNames = async () => {
    const voicesData = await getVoicesData();
    return voicesData.voices.map((voice: any) => voice.name);
};

const findVoiceIdByName = async (name: string): Promise<string | undefined> => {
    const voicesData = await getVoicesData();
    const voice = voicesData.voices.find((v: any) => v.name.toLowerCase() === name.toLowerCase());
    return voice?.voice_id;
};

export const TTSOptionsSchema = () => {
    const baseSchema = OptionsSchema().pick({
        prompt: true,
        include: true,
        dst: true,
        logLevel: true,
        config: true,
        api_key: true,
        alt: true,
    });

    // Create a synchronous voices list for help text
    let voicesHelpText = 'Voice ID or name to use for speech generation. Common voices: Rachel, Clyde, Sarah, Laura, Thomas, Charlie, George (default), Callum, River, Harry, Liam, Alice, Matilda, Will, Jessica, Eric, Chris, Brian, Daniel, Lily, Bill';
    
    // Try to load voices synchronously for help text
    try {
        const possiblePaths = [
            path.resolve('src/lib/voices.json'),
            path.resolve('lib/voices.json'),
        ];
        
        for (const voicesPath of possiblePaths) {
            if (exists(voicesPath)) {
                const voicesContent = read(voicesPath, 'string') as string;
                const voicesData = JSON.parse(voicesContent);
                const voicesList = voicesData.voices.slice(0, 10).map((voice: any) => voice.name).join(', ');
                voicesHelpText = `Voice ID or name to use for speech generation. Available voices: ${voicesList} (and ${voicesData.voices.length - 10} more)`;
                break;
            }
        }
    } catch (error) {
        // Use fallback help text if loading fails
    }

    return baseSchema.extend({
        dst: z.string().describe('Destination path for the output audio file. Required.'),
        prompt: z.string().optional().describe('The text to convert to speech.'),
        voiceId: z.string().default('JBFqnCBsd6RMkjVDRZzb').describe(voicesHelpText),
        outputFormat: z.enum(['mp3_22050_32', 'mp3_44100_32', 'mp3_44100_64', 'mp3_44100_96', 'mp3_44100_128', 'mp3_44100_192', 'pcm_16000', 'pcm_22050', 'pcm_24000', 'pcm_44100', 'ulaw_8000']).default('mp3_44100_128').describe('Output format of the generated audio.'),
        modelId: z.string().default('eleven_multilingual_v2').describe('Model ID to use for speech generation.'),
        languageCode: z.string().optional().describe('Language code (ISO 639-1) to enforce for the model.'),
        stability: z.number().min(0).max(1).optional().describe('Voice stability (0-1).'),
        similarityBoost: z.number().min(0).max(1).optional().describe('Voice similarity boost (0-1).'),
        style: z.number().min(0).max(1).optional().describe('Voice style (0-1).'),
        useSpeakerBoost: z.boolean().optional().describe('Use speaker boost for voice enhancement.'),
        seed: z.number().optional().describe('Seed for deterministic generation (0-4294967295).'),
        previousText: z.string().optional().describe('Text that came before the current text for continuity.'),
        nextText: z.string().optional().describe('Text that comes after the current text for continuity.'),
        applyTextNormalization: z.enum(['auto', 'on', 'off']).default('auto').describe('Text normalization mode.'),
        applyLanguageTextNormalization: z.boolean().default(false).describe('Apply language-specific text normalization.'),
        usePvcAsIvc: z.boolean().default(false).describe('Use PVC as IVC (deprecated).'),
    });
}

export const ttsCommand = async (argv: any) => {
    const logger = getLogger(argv);

    if (argv.include && isString(argv.include)) {
        argv.include = [argv.include];
    }

    try {
        const parsedOptions = TTSOptionsSchema().parse(argv);
        const { include, dst, ...rest } = parsedOptions;
        
        let textContent = '';

        // Handle voice name to ID conversion
        let voiceId = parsedOptions.voiceId;
        if (voiceId && !voiceId.match(/^[a-zA-Z0-9]{20}$/)) {
            // If voiceId doesn't look like an ID (20 alphanumeric chars), treat it as a name
            const foundVoiceId = await findVoiceIdByName(voiceId);
            if (foundVoiceId) {
                voiceId = foundVoiceId;
                logger.info(`Using voice "${parsedOptions.voiceId}" (${voiceId})`);
            } else {
                const availableVoices = await getVoiceNames();
                logger.warn(`Voice name "${voiceId}" not found. Available voices: ${availableVoices.join(', ')}`);
                logger.info(`Using default voice ID: ${parsedOptions.voiceId}`);
            }
        }

        // Get text from --prompt or --include file
        if (parsedOptions.prompt) {
            const promptMessage = await resolvePrompt(parsedOptions);
            textContent = promptMessage?.content as string || '';
        } else if (include && include.length > 0) {
            // Read text from file(s)
            const filePath = include[0]; // Use first file
            if (!exists(filePath)) {
                logger.error(`Input file not found at: ${filePath}`);
                return;
            }
            textContent = read(filePath, 'string') as string;
            logger.info(`Reading text from file: ${filePath}`);
        }

        if (!textContent.trim()) {
            logger.error('No text provided. Use --prompt "text" or --include path/to/textfile.txt');
            return;
        }
        
        if (!dst) {
            logger.error('--dst is required to specify the output audio file path.');
            return;
        }

        // Prepare voice settings if any are specified
        let voiceSettings = null;
        if (parsedOptions.stability !== undefined || 
            parsedOptions.similarityBoost !== undefined || 
            parsedOptions.style !== undefined || 
            parsedOptions.useSpeakerBoost !== undefined) {
            voiceSettings = {
                stability: parsedOptions.stability,
                similarityBoost: parsedOptions.similarityBoost,
                style: parsedOptions.style,
                useSpeakerBoost: parsedOptions.useSpeakerBoost,
            };
        }

        logger.info(`Converting text to speech: "${textContent.substring(0, 100)}${textContent.length > 100 ? '...' : ''}"`);

        const audioBuffer = await generateSpeech({
            text: textContent,
            voiceId: voiceId,
            outputFormat: parsedOptions.outputFormat,
            modelId: parsedOptions.modelId,
            languageCode: parsedOptions.languageCode,
            voiceSettings,
            seed: parsedOptions.seed,
            previousText: parsedOptions.previousText,
            nextText: parsedOptions.nextText,
            applyTextNormalization: parsedOptions.applyTextNormalization,
            applyLanguageTextNormalization: parsedOptions.applyLanguageTextNormalization,
            usePvcAsIvc: parsedOptions.usePvcAsIvc,
            config: parsedOptions.config,
            api_key: parsedOptions.api_key,
            logger,
        });

        if (audioBuffer) {
            const vars = variables(parsedOptions);
            const dstPath = path.resolve(resolve(dst, parsedOptions.alt, vars));
            write(dstPath, audioBuffer);
            logger.info(`Audio saved to: ${dstPath}`);
        } else {
            logger.error('Failed to generate audio.');
        }

    } catch (error: any) {
        logger.error('Failed to parse options or generate speech:', error.message, error.issues, error.stack);
    }
};
