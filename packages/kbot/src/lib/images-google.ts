import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import * as fs from "node:fs";
import { IKBotOptions } from "../zod_types.js";
import { loadConfig } from "../config.js";
import { logger } from "../index.js";
import { lookup } from 'mime-types'

const createGoogleGenAIClient = (options: IKBotOptions) => {
    const config = loadConfig(options);
    if (!config) {
        logger.error(
            "Config not found in $HOME/.osr/config.json. " +
            "Optionally, export OSR_CONFIG with the path to the configuration file."
        );
        return undefined;
    }

    let apiKey = options.api_key || config?.google?.key;
    
    if (!apiKey) {
        logger.error(`No gemini key found. Please provide an "api_key", set it in the config, or pass it via JSON config.`);
        return undefined;
    }

    return new GoogleGenerativeAI(apiKey);
}

export const createImage = async (prompt: string, options: IKBotOptions): Promise<Buffer | null> => {
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
            } else if ('text' in part && part.text) {
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
        
    } catch (error) {
        logger.error('Google AI API error in createImage:', {
            error: error.message,
            stack: error.stack,
            prompt: prompt.substring(0, 100) + '...'
        });
        throw error; // Re-throw to let the caller handle it
    }
}

export const editImage = async (prompt: string, imagePaths: string[], options: IKBotOptions): Promise<Buffer | null> => {
    const ai = createGoogleGenAIClient(options);
    if (!ai) {
        return null;
    }

    const model = ai.getGenerativeModel({ model: options.model || 'gemini-2.5-flash-image-preview' });

    try {
        const imageParts: Part[] = imagePaths.map(imagePath => {
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

        const textPart: Part = { text: prompt };
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
            } else if ('text' in part && part.text) {
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

    } catch (error) {
        logger.error('Google AI API error in editImage:', {
            error: error.message,
            stack: error.stack,
            prompt: prompt.substring(0, 100) + '...',
            imageCount: imagePaths.length,
            imagePaths: imagePaths.map(p => p.split(/[/\\]/).pop())
        });
        throw error; // Re-throw to let the caller handle it
    }
}
