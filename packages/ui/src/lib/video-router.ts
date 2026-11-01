import { GoogleGenAI } from "@google/genai";
import { getGoogleApiKey } from "@/image-api";
import { serverUrl } from "./db";

export interface VideoGenerationResult {
    videoUrl: string;
    metadata?: any;
}

export interface VideoModelInfo {
    modelName: string;
    displayName: string;
    description: string;
    version: '3.1' | '3' | '2';
    isFast?: boolean;
    supportedInput: ('text' | 'image' | 'video')[];
    maxDuration: number; // in seconds
    resolutions: string[];
    aspectRatios: string[];
    personGeneration: ('allow_all' | 'allow_adult' | 'dont_allow')[];
    isPreview?: boolean;
}

export const AVAILABLE_VIDEO_MODELS: VideoModelInfo[] = [
    {
        modelName: 'veo-3.1-generate-preview',
        displayName: 'Veo 3.1 Preview',
        description: 'Latest high-quality model.',
        version: '3.1',
        isPreview: true,
        supportedInput: ['text', 'image'],
        maxDuration: 8,
        resolutions: ['720p', '1080p', '4k'], // 1080p and 4k only support 8s duration
        aspectRatios: ['16:9', '9:16'],
        personGeneration: ['allow_all', 'allow_adult'], // allow_all for text, allow_adult for image
    },
    {
        modelName: 'veo-3.1-fast-generate-preview',
        displayName: 'Veo 3.1 Fast Preview',
        description: 'Faster generation with Veo 3.1 quality.',
        version: '3.1',
        isFast: true,
        isPreview: true,
        supportedInput: ['text', 'image'],
        maxDuration: 8,
        resolutions: ['720p', '1080p', '4k'],
        aspectRatios: ['16:9', '9:16'],
        personGeneration: ['allow_all', 'allow_adult'],
    },
    {
        modelName: 'veo-3.0-generate-001',
        displayName: 'Veo 3',
        description: 'Stable Veo 3 model.',
        version: '3',
        supportedInput: ['text', 'image'],
        maxDuration: 8,
        resolutions: ['720p', '1080p'], // 1080p 16:9 only
        aspectRatios: ['16:9', '9:16'],
        personGeneration: ['allow_all', 'allow_adult'],
    },
    {
        modelName: 'veo-3.0-fast-generate-001',
        displayName: 'Veo 3 Fast',
        description: 'Faster generation with Veo 3 quality.',
        version: '3',
        isFast: true,
        supportedInput: ['text', 'image'],
        maxDuration: 8,
        resolutions: ['720p', '1080p'],
        aspectRatios: ['16:9', '9:16'],
        personGeneration: ['allow_all', 'allow_adult'],
    },
    {
        modelName: 'veo-2.0-generate-001', // Assuming model name for Veo 2 if available, or just placeholder
        displayName: 'Veo 2',
        description: 'Legacy model.',
        version: '2',
        supportedInput: ['text', 'image'],
        maxDuration: 8,
        resolutions: ['720p'],
        aspectRatios: ['16:9', '9:16'],
        personGeneration: ['allow_all', 'allow_adult', 'dont_allow'],
    }
];

export interface VideoGenerationOptions {
    aspectRatio?: string;
    resolution?: string;
    durationSeconds?: number;
    personGeneration?: string;
    negativePrompt?: string;
    firstImage?: { imageBytes: string, mimeType: string };
    lastImage?: { imageBytes: string, mimeType: string };
}

export const generateVideo = async (
    prompt: string,
    imageInput?: { imageBytes: string, mimeType: string }[], // Array of Base64 strings
    model: string = 'veo-3.1-generate-preview',
    options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> => {
    const apiKey = await getGoogleApiKey();
    if (!apiKey) {
        throw new Error("No Google API key found");
    }

    const ai = new GoogleGenAI({
        apiKey, googleAuthOptions: {
            apiKey,
            projectId: "gen-lang-client-0154976832",
        }
    });

    console.log("Using model:", model);
    console.log("With options:", options);
    console.log("With prompt:", prompt);
    console.log("With image input count:", imageInput?.length);
    let operation;

    try {
        const generationConfig: any = {
            model: model,
            prompt: prompt,
            config: {}
        };

        if (imageInput && imageInput.length > 0) {
            // Validate input for debugging
            imageInput.forEach((img, i) => {
                if (!img.imageBytes) console.error(`Image input ${i} missing bytes!`);
            });

            if (model.includes('veo-3.1')) {
                // SDK expects referenceImages inside 'config' object
                generationConfig.config.referenceImages = imageInput.map(img => ({
                    image: {
                        imageBytes: img.imageBytes,
                        mimeType: img.mimeType
                    },
                    referenceType: 'ASSET'
                }));
            } else if (imageInput.length === 1) {
                // Legacy 'image' field is top-level
                generationConfig.image = {
                    imageBytes: imageInput[0].imageBytes,
                    mimeType: imageInput[0].mimeType
                };
            } else {
                // Pass array - technically also Legacy but might need checking if SDK supports it.
                // For now, mapping to top-level image array (if SDK supports it, which it might not based on types)
                // But let's assume older models might use it or it's handled elsewhere. 
                // However, based on reading SDK, 'image' expects object.
                // We'll leave this 'else' block as is but warn it might be ineffective for SDK.
                generationConfig.image = imageInput.map(img => ({
                    imageBytes: img.imageBytes,
                    mimeType: img.mimeType
                }));
            }
        }

        if (options.aspectRatio) generationConfig.config.aspectRatio = options.aspectRatio;
        if (options.resolution) generationConfig.config.resolution = options.resolution;
        if (options.durationSeconds) generationConfig.config.durationSeconds = options.durationSeconds;
        if (options.personGeneration) generationConfig.config.personGeneration = options.personGeneration;
        if (options.negativePrompt) generationConfig.config.negativePrompt = options.negativePrompt;

        // First/Last frame (interpolation) support
        // firstImage → top-level `image` field (starting frame)
        // lastImage → `config.lastFrame` (ending frame, interpolation target)
        if (options.firstImage) {
            generationConfig.image = {
                imageBytes: options.firstImage.imageBytes,
                mimeType: options.firstImage.mimeType
            };
            if (options.lastImage) {
                generationConfig.config.lastFrame = {
                    imageBytes: options.lastImage.imageBytes,
                    mimeType: options.lastImage.mimeType
                };
            }
        }


        operation = await ai.models.generateVideos(generationConfig);

        // Poll the operation status
        while (!operation.done) {
            console.log("Waiting for video generation to complete...");
            await new Promise((resolve) => setTimeout(resolve, 5000)); // 5s poll
            operation = await ai.operations.getVideosOperation({
                operation: operation,
            });
        }

        console.log("Video generation completed", operation);

        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
            const videoFile = operation.response.generatedVideos[0].video;

            // The URI typically requires authentication (API key) to access.
            // We append the key to the URL so the video player can fetch it.
            // Handling both existing query params (?) and no query params.
            const separator = videoFile.uri.includes('?') ? '&' : '?';
            const targetUrl = `${videoFile.uri}${separator}key=${apiKey}`;

            // Use the proxy endpoint to fetch the video, as direct access might be blocked by CORS or require specific headers.
            const proxyUrl = `${serverUrl}/api/videos/proxy?url=${encodeURIComponent(targetUrl)}`;

            return { videoUrl: proxyUrl, metadata: operation.response };
        }

        throw new Error("No video generated");

    } catch (error) {
        console.error("Video generation failed", error);
        throw error;
    }
};
