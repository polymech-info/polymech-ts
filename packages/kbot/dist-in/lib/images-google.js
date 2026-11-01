import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "node:fs";
import { loadConfig } from "../config.js";
import { logger } from "../index.js";
import { lookup } from 'mime-types';
const createGoogleGenAIClient = (options) => {
    const config = loadConfig(options);
    if (!config) {
        logger.error("Config not found in $HOME/.osr/config.json. " +
            "Optionally, export OSR_CONFIG with the path to the configuration file.");
        return undefined;
    }
    let apiKey = options.api_key || config?.google?.key;
    if (!apiKey) {
        logger.error(`No gemini key found. Please provide an "api_key", set it in the config, or pass it via JSON config.`);
        return undefined;
    }
    return new GoogleGenerativeAI(apiKey);
};
export const createImage = async (prompt, options) => {
    const ai = createGoogleGenAIClient(options);
    if (!ai) {
        return null;
    }
    const model = ai.getGenerativeModel({ model: options.model || 'gemini-2.5-flash-image-preview' });
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        logger.debug('Google AI API response structure:', {
            hasResponse: !!response,
            hasCandidates: !!response?.candidates,
            candidatesLength: response?.candidates?.length,
            fullResponse: JSON.stringify(response, null, 2)
        });
        if (!response || !response.candidates || response.candidates.length === 0) {
            logger.error('Invalid API response structure - no candidates found', {
                response: JSON.stringify(response, null, 2)
            });
            throw new Error('No candidates returned from Google AI API. The content may have been blocked due to safety filters or other restrictions.');
        }
        const candidate = response.candidates[0];
        // Check for safety filter rejections first
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            const finishReasonMessages = {
                'IMAGE_SAFETY': 'Content blocked by image safety filters. The image or prompt contains content that violates Google AI safety policies.',
                'SAFETY': 'Content blocked by safety filters. The prompt contains content that violates Google AI safety policies.',
                'RECITATION': 'Content blocked due to recitation concerns. The generated content may be too similar to existing copyrighted material.',
                'OTHER': 'Content generation stopped for other safety or policy reasons.'
            };
            const message = finishReasonMessages[candidate.finishReason] ||
                `Content generation stopped. Reason: ${candidate.finishReason}`;
            logger.error('Google AI blocked content due to safety filters:', {
                finishReason: candidate.finishReason,
                rejectionMessage: message,
                candidate: JSON.stringify(candidate, null, 2)
            });
            throw new Error(`Request blocked by Google AI: ${message}`);
        }
        if (!candidate.content || !candidate.content.parts) {
            logger.error('Invalid candidate structure - no content parts found', {
                candidate: JSON.stringify(candidate, null, 2)
            });
            throw new Error('Invalid response structure from Google AI API - no content parts found.');
        }
        const parts = candidate.content.parts;
        for (const part of parts) {
            if ('inlineData' in part) {
                const inlineData = part.inlineData;
                if (inlineData) {
                    return Buffer.from(inlineData.data, "base64");
                }
            }
            else if ('text' in part && part.text) {
                // Google AI returned text instead of an image - show this to the user
                logger.info('Google AI returned text response instead of image:', {
                    textResponse: part.text,
                    finishReason: candidate.finishReason
                });
                throw new Error(`Google AI response: ${part.text}`);
            }
        }
        logger.warn('No image data found in API response parts', {
            partsCount: parts.length,
            parts: JSON.stringify(parts, null, 2),
            finishReason: candidate.finishReason
        });
        throw new Error('No image data found in API response. The model may not have generated an image.');
    }
    catch (error) {
        logger.error('Google AI API error in createImage:', {
            error: error.message,
            stack: error.stack,
            prompt: prompt.substring(0, 100) + '...'
        });
        throw error; // Re-throw to let the caller handle it
    }
};
export const editImage = async (prompt, imagePaths, options) => {
    const ai = createGoogleGenAIClient(options);
    if (!ai) {
        return null;
    }
    const model = ai.getGenerativeModel({ model: options.model || 'gemini-2.5-flash-image-preview' });
    try {
        const imageParts = imagePaths.map(imagePath => {
            const imageData = fs.readFileSync(imagePath);
            const base64Image = imageData.toString("base64");
            const mimeType = lookup(imagePath) || 'image/png';
            return {
                inlineData: {
                    mimeType,
                    data: base64Image,
                },
            };
        });
        const textPart = { text: prompt };
        const promptParts = [...imageParts, textPart];
        const result = await model.generateContent(promptParts);
        const response = result.response;
        logger.debug('Google AI API response structure (editImage):', {
            hasResponse: !!response,
            hasCandidates: !!response?.candidates,
            candidatesLength: response?.candidates?.length,
            fullResponse: JSON.stringify(response, null, 2)
        });
        if (!response || !response.candidates || response.candidates.length === 0) {
            logger.error('Invalid API response structure - no candidates found (editImage)', {
                response: JSON.stringify(response, null, 2),
                prompt: prompt.substring(0, 100) + '...',
                imageCount: imagePaths.length
            });
            throw new Error('No candidates returned from Google AI API. The content may have been blocked due to safety filters or other restrictions.');
        }
        const candidate = response.candidates[0];
        // Check for safety filter rejections first
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            const finishReasonMessages = {
                'IMAGE_SAFETY': 'Content blocked by image safety filters. The image or prompt contains content that violates Google AI safety policies.',
                'SAFETY': 'Content blocked by safety filters. The prompt contains content that violates Google AI safety policies.',
                'RECITATION': 'Content blocked due to recitation concerns. The generated content may be too similar to existing copyrighted material.',
                'OTHER': 'Content generation stopped for other safety or policy reasons.'
            };
            const message = finishReasonMessages[candidate.finishReason] ||
                `Content generation stopped. Reason: ${candidate.finishReason}`;
            logger.error('Google AI blocked image edit due to safety filters:', {
                finishReason: candidate.finishReason,
                rejectionMessage: message,
                candidate: JSON.stringify(candidate, null, 2),
                prompt: prompt.substring(0, 100) + '...',
                imageCount: imagePaths.length
            });
            throw new Error(`Request blocked by Google AI: ${message}`);
        }
        if (!candidate.content || !candidate.content.parts) {
            logger.error('Invalid candidate structure - no content parts found (editImage)', {
                candidate: JSON.stringify(candidate, null, 2),
                prompt: prompt.substring(0, 100) + '...',
                imageCount: imagePaths.length
            });
            throw new Error('Invalid response structure from Google AI API - no content parts found.');
        }
        const parts = candidate.content.parts;
        for (const part of parts) {
            if ('inlineData' in part) {
                const inlineData = part.inlineData;
                if (inlineData) {
                    return Buffer.from(inlineData.data, "base64");
                }
            }
            else if ('text' in part && part.text) {
                // Google AI returned text instead of an image - show this to the user
                logger.info('Google AI returned text response instead of image (editImage):', {
                    textResponse: part.text,
                    finishReason: candidate.finishReason,
                    prompt: prompt.substring(0, 100) + '...',
                    imageCount: imagePaths.length
                });
                throw new Error(`Google AI response: ${part.text}`);
            }
        }
        logger.warn('No image data found in API response parts (editImage)', {
            partsCount: parts.length,
            parts: JSON.stringify(parts, null, 2),
            prompt: prompt.substring(0, 100) + '...',
            imageCount: imagePaths.length,
            finishReason: candidate.finishReason
        });
        throw new Error('No image data found in API response. The model may not have generated an image.');
    }
    catch (error) {
        logger.error('Google AI API error in editImage:', {
            error: error.message,
            stack: error.stack,
            prompt: prompt.substring(0, 100) + '...',
            imageCount: imagePaths.length,
            imagePaths: imagePaths.map(p => p.split(/[/\\]/).pop())
        });
        throw error; // Re-throw to let the caller handle it
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VzLWdvb2dsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvaW1hZ2VzLWdvb2dsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsa0JBQWtCLEVBQVEsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRSxPQUFPLEtBQUssRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUU5QixPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQzFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDckMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUVuQyxNQUFNLHVCQUF1QixHQUFHLENBQUMsT0FBcUIsRUFBRSxFQUFFO0lBQ3RELE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDVixNQUFNLENBQUMsS0FBSyxDQUNSLDhDQUE4QztZQUM5Qyx3RUFBd0UsQ0FDM0UsQ0FBQztRQUNGLE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDO0lBRXBELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNWLE1BQU0sQ0FBQyxLQUFLLENBQUMscUdBQXFHLENBQUMsQ0FBQztRQUNwSCxPQUFPLFNBQVMsQ0FBQztJQUNyQixDQUFDO0lBRUQsT0FBTyxJQUFJLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzFDLENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRyxLQUFLLEVBQUUsTUFBYyxFQUFFLE9BQXFCLEVBQTBCLEVBQUU7SUFDL0YsTUFBTSxFQUFFLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsSUFBSSxDQUFDLEVB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