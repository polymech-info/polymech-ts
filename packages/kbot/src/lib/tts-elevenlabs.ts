import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { getLogger } from '../index.js';
import { loadConfig } from '../config.js';

// Define output format type based on ElevenLabs API documentation
type OutputFormat = 
    | "mp3_22050_32" | "mp3_44100_32" | "mp3_44100_64" | "mp3_44100_96" | "mp3_44100_128" | "mp3_44100_192"
    | "pcm_16000" | "pcm_22050" | "pcm_24000" | "pcm_44100" | "ulaw_8000";

export interface TTSOptions {
    text: string;
    voiceId?: string;
    outputFormat?: OutputFormat;
    modelId?: string;
    languageCode?: string | null;
    voiceSettings?: {
        stability?: number;
        similarityBoost?: number;
        style?: number;
        useSpeakerBoost?: boolean;
    } | null;
    pronunciationDictionaryLocators?: Array<{
        pronunciationDictionaryId: string;
        versionId: string;
    }> | null;
    seed?: number | null;
    previousText?: string | null;
    nextText?: string | null;
    previousRequestIds?: string[] | null;
    nextRequestIds?: string[] | null;
    applyTextNormalization?: 'auto' | 'on' | 'off';
    applyLanguageTextNormalization?: boolean;
    usePvcAsIvc?: boolean;
    config?: any;
    api_key?: string;
    logger?: any;
}

export const generateSpeech = async (options: TTSOptions): Promise<Buffer> => {
    const logger = options.logger || getLogger({ logLevel: 4 });
    
    // Get API key from options or config
    const config = loadConfig(options);
    const apiKey = options.api_key || config?.elevenlabs?.key;
    
    if (!apiKey) {
        throw new Error('ElevenLabs API key not found. Please provide it via --api_key or in your config file under elevenlabs.key');
    }

    const client = new ElevenLabsClient({ 
        apiKey: apiKey 
    });

    try {
        logger.info(`Generating speech with ElevenLabs...`);
        logger.debug(`Voice ID: ${options.voiceId || 'JBFqnCBsd6RMkjVDRZzb'}`);
        logger.debug(`Model: ${options.modelId || 'eleven_multilingual_v2'}`);
        logger.debug(`Output Format: ${options.outputFormat || 'mp3_44100_128'}`);
        logger.debug(`Text length: ${options.text.length} characters`);

        const audioStream = await client.textToSpeech.convert(
            options.voiceId || "JBFqnCBsd6RMkjVDRZzb",
            {
                outputFormat: options.outputFormat || "mp3_44100_128",
                text: options.text,
                modelId: options.modelId || "eleven_multilingual_v2",
                languageCode: options.languageCode,
                voiceSettings: options.voiceSettings,
                pronunciationDictionaryLocators: options.pronunciationDictionaryLocators,
                seed: options.seed,
                previousText: options.previousText,
                nextText: options.nextText,
                previousRequestIds: options.previousRequestIds,
                nextRequestIds: options.nextRequestIds,
                applyTextNormalization: options.applyTextNormalization || 'auto',
                applyLanguageTextNormalization: options.applyLanguageTextNormalization || false,
                usePvcAsIvc: options.usePvcAsIvc || false,
            }
        );

        // The convert endpoint returns a ReadableStream, we need to collect all chunks
        const chunks: Uint8Array[] = [];
        const reader = audioStream.getReader();
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
        } finally {
            reader.releaseLock();
        }
        
        // Combine all chunks into a single buffer
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const audioBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            audioBuffer.set(chunk, offset);
            offset += chunk.length;
        }
        
        const finalBuffer = Buffer.from(audioBuffer);
        logger.info(`Successfully generated ${finalBuffer.length} bytes of audio`);
        
        return finalBuffer;

    } catch (error: any) {
        logger.error('Failed to generate speech with ElevenLabs:', error.message);
        if (error.response?.data) {
            logger.error('API Error Details:', error.response.data);
        }
        throw error;
    }
};
