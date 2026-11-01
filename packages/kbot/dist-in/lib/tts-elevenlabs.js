import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { getLogger } from '../index.js';
import { loadConfig } from '../config.js';
export const generateSpeech = async (options) => {
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
        const audioStream = await client.textToSpeech.convert(options.voiceId || "JBFqnCBsd6RMkjVDRZzb", {
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
        });
        // The convert endpoint returns a ReadableStream, we need to collect all chunks
        const chunks = [];
        const reader = audioStream.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                chunks.push(value);
            }
        }
        finally {
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
    }
    catch (error) {
        logger.error('Failed to generate speech with ElevenLabs:', error.message);
        if (error.response?.data) {
            logger.error('API Error Details:', error.response.data);
        }
        throw error;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHRzLWVsZXZlbmxhYnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3R0cy1lbGV2ZW5sYWJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQzdELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDeEMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQW9DMUMsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLEtBQUssRUFBRSxPQUFtQixFQUFtQixFQUFFO0lBQ3pFLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFNUQscUNBQXFDO0lBQ3JDLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDO0lBRTFELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsMkdBQTJHLENBQUMsQ0FBQztJQUNqSSxDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQztRQUNoQyxNQUFNLEVBQUUsTUFBTTtLQUNqQixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLE9BQU8sQ0FBQyxPQUFPLElBQUksc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZFLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxPQUFPLENBQUMsT0FBTyxJQUFJLHdCQUF3QixFQUFFLENBQUMsQ0FBQztRQUN0RSxNQUFNLENB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