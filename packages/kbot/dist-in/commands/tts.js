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
let voicesCache = null;
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
                    voicesContent = read(cleanPath, 'string');
                    break;
                }
            }
            if (voicesContent) {
                voicesCache = JSON.parse(voicesContent);
            }
            else {
                // Fallback to empty voices list if file doesn't exist
                voicesCache = { voices: [] };
            }
        }
        catch (error) {
            // Fallback to empty voices list if file doesn't exist
            voicesCache = { voices: [] };
        }
    }
    return voicesCache;
};
// Extract voice names and IDs for help text
const getVoicesList = async () => {
    const voicesData = await getVoicesData();
    return voicesData.voices.map((voice) => `${voice.name} (${voice.voice_id})`).join(', ');
};
const getVoiceNames = async () => {
    const voicesData = await getVoicesData();
    return voicesData.voices.map((voice) => voice.name);
};
const findVoiceIdByName = async (name) => {
    const voicesData = await getVoicesData();
    const voice = voicesData.voices.find((v) => v.name.toLowerCase() === name.toLowerCase());
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
                const voicesContent = read(voicesPath, 'string');
                const voicesData = JSON.parse(voicesContent);
                const voicesList = voicesData.voices.slice(0, 10).map((voice) => voice.name).join(', ');
                voicesHelpText = `Voice ID or name to use for speech generation. Available voices: ${voicesList} (and ${voicesData.voices.length - 10} more)`;
                break;
            }
        }
    }
    catch (error) {
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
};
export const ttsCommand = async (argv) => {
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
            }
            else {
                const availableVoices = await getVoiceNames();
                logger.warn(`Voice name "${voiceId}" not found. Available voices: ${availableVoices.join(', ')}`);
                logger.info(`Using default voice ID: ${parsedOptions.voiceId}`);
            }
        }
        // Get text from --prompt or --include file
        if (parsedOptions.prompt) {
            const promptMessage = await resolvePrompt(parsedOptions);
            textContent = promptMessage?.content || '';
        }
        else if (include && include.length > 0) {
            // Read text from file(s)
            const filePath = include[0]; // Use first file
            if (!exists(filePath)) {
                logger.error(`Input file not found at: ${filePath}`);
                return;
            }
            textContent = read(filePath, 'string');
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
        }
        else {
            logger.error('Failed to generate audio.');
        }
    }
    catch (error) {
        logger.error('Failed to parse options or generate speech:', error.message, error.issues, error.stack);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3R0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQ3hCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVyRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDakQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQzFELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDeEMsT0FBTyxFQUFFLE1BQU0sSUFBSSxhQUFhLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDdkQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQzVDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUM1Qyx3QkFBd0I7QUFDeEIsSUFBSSxXQUFXLEdBQVEsSUFBSSxDQUFDO0FBRTVCLE1BQU0sYUFBYSxHQUFHLEtBQUssSUFBSSxFQUFFO0lBQzdCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQztZQUNELDhDQUE4QztZQUM5QyxNQUFNLGFBQWEsR0FBRztnQkFDbEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztnQkFDL0IsSUFBSSxD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