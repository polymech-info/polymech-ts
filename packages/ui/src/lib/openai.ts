/**
 * OpenAI Integration with Tool Presets
 * 
 * PRESET QUICK REFERENCE:
 * ----------------------
 * Agent/Voice Agent: 'smart-generation' (optimize → generate → metadata, NO publish)
 * Workflows:         'metadata-only' for metadata step
 * Auto workflows:    'auto-publish' (includes publish tool)
 * 
 * See PRESET_TOOLS mapping below for tool combinations.
 */
import OpenAI from 'openai';
import { getAuthToken as getZitadelToken, serverUrl } from "@/lib/db";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';
import { JSONSchema } from 'openai/lib/jsonschema';
import { createImage as createImageRouter, editImage as editImageRouter } from '@/lib/image-router';
import { generateTextWithImagesTool } from '@/lib/markdownImageTools';
import { createPageTool } from '@/lib/pageTools';
import { createWidgetsTool } from '@/lib/tools-layout';
import { encodeWav } from '@/lib/audioUtils';

type LogFunction = (level: string, message: string, data?: any) => void;

// Simple logger for user feedback
const consoleLogger = {
  debug: (message: string, data?: any) => console.debug(`[OPENAI-DEBUG] ${message}`, data),
  info: (message: string, data?: any) => console.info(`[OPENAI-INFO] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[OPENAI-WARN] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[OPENAI-ERROR] ${message}`, data),
};

/**
 * SIMPLE TOOL PRESET MAPPING
 * 
 * This mapping defines common tool combinations:
 * - generate-only:      [generate]
 * - generate-metadata:  [generate, metadata]
 * - generate-publish:   [generate, metadata, publish]
 * - metadata-only:      [metadata]
 * - optimize-generate:  [optimize, generate, metadata]
 * 
 * Use these to avoid calling unwanted tools (e.g., publish when user wants manual control)
 */
export type PresetType =
  | 'generate-only'        // Just generate image
  | 'generate-metadata'    // Generate + metadata
  | 'generate-publish'     // Generate + metadata + publish
  | 'metadata-only'        // Only metadata
  | 'optimize-generate'    // Optimize + generate + metadata
  | 'layout-generator';    // Generate widget layout fragments

const PRESET_TOOLS: Record<PresetType, (apiKey?: string) => RunnableToolFunctionWithParse<any>[]> = {
  'generate-only': (apiKey) => [
    generateImageTool(apiKey)
  ],
  'generate-metadata': (apiKey) => [
    generateImageTool(apiKey),
    generateImageMetadataTool(apiKey)
  ],
  'generate-publish': (apiKey) => [
    generateImageTool(apiKey),
    generateImageMetadataTool(apiKey),
    publishImageTool()
  ],
  'metadata-only': (apiKey) => [
    generateImageMetadataTool(apiKey)
  ],
  'optimize-generate': (apiKey) => [
    optimizePromptTool(apiKey),
    generateImageTool(apiKey),
    generateImageMetadataTool(apiKey)
  ],
  'layout-generator': () => [
    createWidgetsTool(),
  ],
};

// Get user's session token for proxy authentication
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await getZitadelToken();
    if (!token) {
      consoleLogger.error('No authenticated session found');
      return null;
    }
    return token;
  } catch (error) {
    consoleLogger.error('Error getting auth token:', error);
    return null;
  }
};


// Create OpenAI client
export const createOpenAIClient = async (apiKey?: string): Promise<OpenAI | null> => {
  let token = apiKey;

  if (!token || token.startsWith('sk-')) {
    if (token?.startsWith('sk-')) {
      consoleLogger.warn('Legacy OpenAI key detected and ignored. Using Zitadel session token for proxy.');
    }
    token = (await getAuthToken()) || undefined;
  }

  if (!token) {
    consoleLogger.error('No authentication token found. Please sign in.');
    return null;
  }

  try {
    console.log('[createOpenAIClient] apiKey arg:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    console.log('[createOpenAIClient] resolved token:', token ? token.substring(0, 10) + '...' : 'null');
    return new OpenAI({
      apiKey: token, // This is sent as Bearer token to our proxy
      baseURL: `${serverUrl}/api/openai/v1`,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  } catch (error) {
    consoleLogger.error('Error creating OpenAI client:', error);
    return null;
  }
};

// Helper function to check if OpenAI is available (non-throwing)
export const isOpenAIAvailable = async (apiKey?: string): Promise<boolean> => {
  try {
    const client = await createOpenAIClient(apiKey);
    return client !== null;
  } catch (error) {
    consoleLogger.debug('OpenAI not available:', error);
    return false;
  }
};

// Safe wrapper for OpenAI operations that handles missing API key gracefully
export const withOpenAI = async <T>(
  operation: (client: OpenAI) => Promise<T>,
  fallback?: T,
  apiKey?: string
): Promise<T | null> => {
  try {
    const client = await createOpenAIClient(apiKey);
    if (!client) {
      consoleLogger.warn('OpenAI client not available, using fallback or returning null');
      return fallback ?? null;
    }

    return await operation(client);
  } catch (error) {
    consoleLogger.error('OpenAI operation failed:', error);
    return fallback ?? null;
  }
};

// Simple text completion function
export const generateText = async (
  input: string,
  model: string = "gpt-5",
  apiKey?: string,

  signal?: AbortSignal,
  onChunk?: (chunk: string) => void,
  webSearch?: boolean
): Promise<string | null> => {
  return withOpenAI(async (client) => {
    try {
      // If web search is enabled, we MUST use the responses API
      if (webSearch) {
        consoleLogger.info('Using web_search with responses API', { model });

        const response = await (client as any).responses?.create({
          model,
          tools: [{ type: "web_search" }],
          input,
        });

        // Parse response.output array structure
        if (response?.output && Array.isArray(response.output)) {
          const messageItem = response.output.find((item: any) => item.type === 'message');

          if (messageItem?.content && Array.isArray(messageItem.content)) {
            const textItem = messageItem.content.find((c: any) => c.type === 'output_text');

            if (textItem?.text) {
              consoleLogger.info('Successfully generated text with web search', {
                inputLength: input.length,
                outputLength: textItem.text.length,
                model
              });
              return textItem.text;
            }
          }
        }

        consoleLogger.warn('Web search response had no valid text content', { response });
      }

      // Streaming implementation
      if (onChunk) {
        const stream = await client.chat.completions.create({
          model,
          messages: [{ role: "user", content: input }],
          stream: true,
        }, { signal });

        let fullContent = '';
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
        }

        consoleLogger.info('Successfully streamed text response', {
          inputLength: input.length,
          outputLength: fullContent.length,
          model
        });

        return fullContent;
      }

      // Non-streaming implementation
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: input }]
      }, {
        signal, // Pass abort signal to OpenAI client
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        consoleLogger.warn('No content returned from OpenAI');
        return null;
      }

      consoleLogger.info('Successfully generated text response', {
        inputLength: input.length,
        outputLength: content.length,
        model,
        content
      });

      return content;
    } catch (error: any) {
      // Handle abort error specifically
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        consoleLogger.info('Text generation aborted by user');
        return null;
      }

      consoleLogger.error('OpenAI text generation failed:', {
        error: error.message,
        model,
        inputPreview: input.substring(0, 100) + '...'
      });
      throw error;
    }
  }, null, apiKey);
};

// Alternative function using the responses API (if available)
export const generateResponse = async (
  input: string,
  model: string = "gpt-4o-mini",
  apiKey?: string
): Promise<string | null> => {
  return withOpenAI(async (client) => {
    try {
      // Note: The responses API might not be available in all OpenAI versions
      // This is a placeholder for the API structure you mentioned
      const response = await (client as any).responses?.create({
        model,
        input,
      });

      if (!response) {
        consoleLogger.warn('Responses API not available, falling back to chat completions');
        return generateText(input, model, apiKey);
      }

      consoleLogger.info('Successfully generated response', {
        inputLength: input.length,
        model
      });

      return response;
    } catch (error: any) {
      consoleLogger.error('OpenAI responses API failed, falling back to chat completions:', error.message);
      // Fallback to standard chat completions
      return generateText(input, model, apiKey);
    }
  }, null, apiKey);
};

// Helper to convert File to base64 (browser-compatible)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Get MIME type from file
const getImageMimeType = (file: File): string => {
  return file.type || 'image/jpeg';
};

// Image analysis function for generating descriptions and titles
export const analyzeImages = async (
  imageFiles: File[],
  prompt: string = "Analyze this image and provide a detailed description and suggest a creative title.",
  model: string = "gpt-4o-mini",
  apiKey?: string
): Promise<{ description: string; title: string } | null> => {
  return withOpenAI(async (client) => {
    try {
      if (imageFiles.length === 0) {
        consoleLogger.warn('No images provided for analysis');
        return null;
      }

      // Convert all images to base64
      const imageContents = await Promise.all(
        imageFiles.map(async (file) => {
          const base64 = await fileToBase64(file);
          const mimeType = getImageMimeType(file);
          return {
            type: "input_image" as const,
            image_url: `data:${mimeType};base64,${base64}`,
          };
        })
      );

      // Create the content array with text prompt and images
      const content = [
        { type: "input_text" as const, text: prompt },
        ...imageContents
      ];

      // Use responses API for image analysis
      const response = await (client as any).responses?.create({
        model,
        input: [
          {
            role: "user",
            content,
          },
        ],
      });

      if (!response?.output_text) {
        consoleLogger.warn('No output text returned from OpenAI image analysis');
        return null;
      }

      const outputText = response.output_text;

      // Try to parse description and title from the response
      // This assumes the AI will format it properly, but we'll add some parsing logic
      const lines = outputText.split('\n').filter(line => line.trim());

      let description = outputText;
      let title = `Analysis of ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}`;
      let titleLineIndex = -1;

      // Simple parsing - look for title patterns
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('title:') || lowerLine.includes('suggested title:')) {
          title = line.replace(/^.*title:\s*/i, '').trim();
          titleLineIndex = i;
          break;
        }
      }

      // Remove title line from description
      if (titleLineIndex >= 0) {
        const descriptionLines = lines.filter((_, index) => index !== titleLineIndex);
        description = descriptionLines.join('\n').trim();
      }

      consoleLogger.info('Successfully analyzed images', {
        imageCount: imageFiles.length,
        descriptionLength: description.length,
        title: title.substring(0, 50) + '...',
        model
      });

      return { description, title };

    } catch (error: any) {
      consoleLogger.error('OpenAI image analysis failed:', {
        error: error.message,
        model,
        imageCount: imageFiles.length,
        promptPreview: prompt.substring(0, 100) + '...'
      });

      // Fallback to chat completions if responses API fails
      try {
        consoleLogger.info('Falling back to chat completions for image analysis');

        const imageContents = await Promise.all(
          imageFiles.map(async (file) => {
            const base64 = await fileToBase64(file);
            const mimeType = getImageMimeType(file);
            return {
              type: "image_url" as const,
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            };
          })
        );

        const response = await client.chat.completions.create({
          model: "gpt-4-vision-preview", // Use vision model for fallback
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                ...imageContents
              ],
            },
          ]
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          consoleLogger.warn('No content returned from fallback image analysis');
          return null;
        }

        // Parse the fallback response
        const lines = content.split('\n').filter(line => line.trim());
        let description = content;
        let title = `Analysis of ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}`;
        let titleLineIndex = -1;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('title:') || lowerLine.includes('suggested title:')) {
            title = line.replace(/^.*title:\s*/i, '').trim();
            titleLineIndex = i;
            break;
          }
        }

        // Remove title line from description
        if (titleLineIndex >= 0) {
          const descriptionLines = lines.filter((_, index) => index !== titleLineIndex);
          description = descriptionLines.join('\n').trim();
        }

        return { description, title };

      } catch (fallbackError: any) {
        consoleLogger.error('Fallback image analysis also failed:', fallbackError.message);
        throw error; // Throw original error
      }
    }
  }, null, apiKey);
};

// Simplified function for wizard integration (disabled for now)
export const generateImageMetadata = async (
  imageFiles: File[],
  apiKey?: string
): Promise<{ description: string; title: string } | null> => {
  // This function is disabled for now as mentioned in requirements
  consoleLogger.info('Image metadata generation is currently disabled');
  return null;

  // When enabled, uncomment this:
  // return analyzeImages(
  //   imageFiles,
  //   "Analyze these images and provide: 1) A detailed description of what you see, and 2) A creative, engaging title. Format your response with 'Title: [your title]' on the first line, followed by the description.",
  //   "gpt-4.1-mini",
  //   apiKey
  // );
};

// Audio transcription function using OpenRouter Multimodal Chat Completions
export const transcribeAudio = async (
  audioFile: File,
  model: string = "google/gemini-2.5-flash",
  apiKey?: string
): Promise<string | null> => {
  try {
    consoleLogger.info('Starting audio transcription via OpenRouter', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
      model
    });

    // Get auth token for proxy
    let token = apiKey;
    if (!token || token.startsWith('sk-')) {
      token = (await getAuthToken()) || undefined;
    }

    if (!token) {
      consoleLogger.error('No authentication token found. Please sign in.');
      return null;
    }

    // Convert audio file to base64
    const base64Audio = await encodeWav(audioFile);

    // Use the OpenRouter proxy endpoint
    const response = await fetch(`${serverUrl}/api/openrouter/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe this audio file exactly as spoken, without any additional commentary.",
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format: "wav",
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${data.error?.message || response.statusText}`);
    }

    const transcribedText = data.choices?.[0]?.message?.content;

    if (!transcribedText) {
      consoleLogger.warn('No text returned from audio transcription');
      return null;
    }

    consoleLogger.info('Successfully transcribed audio', {
      textLength: transcribedText.length,
      textPreview: transcribedText.substring(0, 100) + '...',
      model
    });

    return transcribedText;
  } catch (error: any) {
    consoleLogger.error('OpenRouter audio transcription failed:', {
      error: error.message,
      fileName: audioFile.name,
      model
    });
    throw error;
  }
};

// Optimize prompt for image generation
export const optimizePrompt = async (
  userPrompt: string,
  model: string = "gpt-5",
  apiKey?: string
): Promise<string | null> => {
  return withOpenAI(async (client) => {
    try {
      consoleLogger.info('Starting prompt optimization', {
        originalPromptLength: userPrompt.length,
        originalPromptPreview: userPrompt.substring(0, 100) + '...',
        model
      });

      const systemPrompt = `You are an expert at writing prompts for AI image generation models. Your task is to optimize user prompts to produce better, more detailed, and more visually striking images.

Guidelines for optimization:
- Add specific visual details (lighting, composition, style, mood, colors)
- Include technical photography/art terms when relevant (e.g., "bokeh", "golden hour", "rule of thirds")
- Specify artistic styles if not mentioned (e.g., "cinematic", "photorealistic", "digital art")
- Add quality enhancers (e.g., "highly detailed", "4k", "masterpiece")
- Keep the core intent of the user's prompt
- Make it concise but descriptive (aim for 1-3 sentences)
- Return ONLY the optimized prompt, no explanations or additional text

Example:
User: "a cat sitting on a chair"
Optimized: "A fluffy tabby cat sitting gracefully on a vintage wooden chair, soft natural lighting from a nearby window creating gentle shadows, photorealistic style, highly detailed fur texture, warm color palette, shallow depth of field"`;

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      const optimizedPrompt = response.choices[0]?.message?.content?.trim();

      if (!optimizedPrompt) {
        consoleLogger.warn('No optimized prompt returned from OpenAI');
        return null;
      }

      consoleLogger.info('Successfully optimized prompt', {
        originalLength: userPrompt.length,
        optimizedLength: optimizedPrompt.length,
        optimizedPreview: optimizedPrompt.substring(0, 100) + '...',
        model
      });

      return optimizedPrompt;
    } catch (error: any) {
      consoleLogger.error('OpenAI prompt optimization failed:', {
        error: error.message,
        promptPreview: userPrompt.substring(0, 100) + '...',
        model
      });
      throw error;
    }
  }, null, apiKey);
};

// Generate HTML snippet with Tailwind CSS
export const generateHtmlSnippet = async (
  userPrompt: string,
  contextVariables: Record<string, any> = {},
  pageContext: any = null,
  apiKey?: string
): Promise<string | null> => {
  return withOpenAI(async (client) => {
    try {
      consoleLogger.info('Starting HTML snippet generation', {
        promptLength: userPrompt.length,
        hasContext: Object.keys(contextVariables).length > 0,
        hasPageContext: !!pageContext
      });

      const variableList = Object.keys(contextVariables).map(k => `\${${k}}`).join(', ');

      const contextPrompt = Object.keys(contextVariables).length > 0
        ? `\nAvailable Variables: You can use these variables in your HTML: ${variableList}. Use the syntax \${variableName} to insert them.`
        : '';

      const pageContextPrompt = pageContext
        ? `\nPage Context (JSON): Use this to understand the surrounding page structure/data if relevant:\n\`\`\`json\n${JSON.stringify(pageContext, null, 2).slice(0, 5000)}\n\`\`\``
        : '';

      const systemPrompt = `You are an expert Tailwind CSS and HTML developer.
Your task is to generate or modify a standalone HTML snippet based on the user's request.

Rules:
1. Return ONLY the HTML code. Do NOT wrap it in markdown code blocks (\`\`\`html ... \`\`\`\`).
2. Do NOT include any explanations, comments, or conversational text.
3. Use Tailwind CSS classes for styling.
4. The HTML should be a document fragment (e.g., a <div>, <section>, or <article>), NOT a full <html> document.
5. Make the design modern, clean, and responsive.${contextPrompt}${pageContextPrompt}
6. If icons are needed, use valid inline <svg> elements with Tailwind classes. Do NOT use React component names (like <LucideIcon />) as they will not render.
7. Ensure strict accessibility compliance (aria-labels, roles).`;

      console.log('System prompt:', systemPrompt);
      console.log('User prompt:', userPrompt);

      const response = await client.chat.completions.create({
        model: "gpt-4o", // Stronger model for code generation
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });



      let content = response.choices[0]?.message?.content?.trim();

      if (!content) {
        consoleLogger.warn('No HTML returned from OpenAI');
        return null;
      }

      // Cleanup if the model ignored the "no markdown" rule
      content = content.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

      return content;
    } catch (error: any) {
      consoleLogger.error('OpenAI HTML generation failed:', error);
      throw error;
    }
  }, null, apiKey);
};

/**
 * Helper function to create Zod-validated OpenAI tools
 * Based on ref/tools/index.ts
 */
export const zodFunction = <T extends object>({
  function: fn,
  schema,
  description = '',
  name,
}: {
  function: (args: T) => Promise<object>;
  schema: z.ZodSchema<T>;
  description?: string;
  name?: string;
}): RunnableToolFunctionWithParse<T> => {
  return {
    type: 'function',
    function: {
      function: fn,
      name: name ?? fn.name,
      description: description,
      parameters: zodToJsonSchema(schema, { target: 'openAi' }) as JSONSchema,
      parse(input: string): T {
        const obj = JSON.parse(input);
        return schema.parse(obj);
      },
    },
  };
};

// ====================================================================
// TOOL DEFINITIONS
// ====================================================================

/**
 * Tool: Generate Image
 * Creates a new image from a text prompt using the specified AI model
 */
export const generateImageTool = (apiKey?: string) =>
  zodFunction({
    name: 'generate_image',
    description: 'Generate one or more images from a text prompt using AI image generation models. Supports multiple providers (Google, Replicate, Bria, AIML API). Can generate multiple images if count is specified.',
    schema: z.object({
      prompt: z.string().describe('The text prompt describing the image to generate'),
      count: z.number().optional().describe('Number of images to generate (1-4). Default: 1'),
      model: z.string().optional().describe('Model string in format "provider/model-name". Default: "google/gemini-3-pro-image-preview"'),
    }),
    function: async (args) => {
      try {
        const count = Math.min(Math.max(args.count || 1, 1), 4); // Clamp between 1-4
        consoleLogger.info('Tool::GenerateImage called', {
          prompt: args.prompt,
          model: args.model,
          count
        });

        // Image Router will fetch the appropriate provider API key from user profile
        // Don't pass OpenAI API key to image generation
        const results = [];

        // Generate multiple images if count > 1
        for (let i = 0; i < count; i++) {
          const result = await createImageRouter(
            args.prompt,
            args.model || 'google/gemini-3-pro-image-preview',
            undefined // Let Image Router fetch the correct provider API key
          );

          if (!result) {
            consoleLogger.warn(`Image ${i + 1}/${count} generation failed`);
            continue;
          }

          // Convert ArrayBuffer to blob URL
          const uint8Array = new Uint8Array(result.imageData);
          const blob = new Blob([uint8Array], { type: 'image/png' });
          const imageUrl = URL.createObjectURL(blob);

          results.push({
            imageUrl,
            text: result.text,
          });
        }

        if (results.length === 0) {
          return { success: false, error: 'Failed to generate any images' };
        }

        return {
          success: true,
          images: results,
          count: results.length,
          message: `${results.length} image${results.length > 1 ? 's' : ''} generated successfully`,
        };
      } catch (error: any) {
        consoleLogger.error('Tool::GenerateImage failed', error);
        return { success: false, error: error.message };
      }
    },
  });

/**
 * Tool: Transcribe Audio
 * Converts speech/audio to text using OpenAI Whisper
 */
export const transcribeAudioTool = (apiKey?: string) =>
  zodFunction({
    name: 'transcribe_audio',
    description: 'Transcribe audio or speech to text using OpenAI Whisper model. Accepts audio files in various formats.',
    schema: z.object({
      audioFile: z.any().describe('The audio file to transcribe (File object)'),
      model: z.string().optional().describe('Whisper model to use. Default: "whisper-1"'),
    }),
    function: async (args) => {
      try {
        consoleLogger.info('Tool::TranscribeAudio called', { model: args.model });

        const text = await transcribeAudio(args.audioFile, args.model, apiKey);

        if (!text) {
          return { success: false, error: 'Failed to transcribe audio' };
        }

        return {
          success: true,
          text,
          message: 'Audio transcribed successfully',
        };
      } catch (error: any) {
        consoleLogger.error('Tool::TranscribeAudio failed', error);
        return { success: false, error: error.message };
      }
    },
  });

/**
 * Tool: Optimize Prompt
 * Enhances a user's prompt to produce better image generation results
 */
export const optimizePromptTool = (apiKey?: string) =>
  zodFunction({
    name: 'optimize_prompt',
    description: 'Optimize and enhance a text prompt for better image generation results. Adds specific visual details, technical terms, and quality enhancers.',
    schema: z.object({
      prompt: z.string().describe('The original user prompt to optimize'),
      model: z.string().optional().describe('GPT model to use for optimization. Default: "gpt-4o-mini"'),
    }),
    function: async (args) => {
      try {
        consoleLogger.info('Tool::OptimizePrompt called', { promptLength: args.prompt.length });

        const optimized = await optimizePrompt(args.prompt, args.model, apiKey);

        if (!optimized) {
          return { success: false, error: 'Failed to optimize prompt' };
        }

        return {
          success: true,
          originalPrompt: args.prompt,
          optimizedPrompt: optimized,
          message: 'Prompt optimized successfully',
        };
      } catch (error: any) {
        consoleLogger.error('Tool::OptimizePrompt failed', error);
        return { success: false, error: error.message };
      }
    },
  });

/**
 * Tool: Generate Text
 * Generates text completion using GPT models
 */
export const generateTextTool = (apiKey?: string) =>
  zodFunction({
    name: 'generate_text',
    description: 'Generate text completion using OpenAI GPT models. Useful for creating descriptions, titles, or any text content.',
    schema: z.object({
      input: z.string().describe('The input text or prompt'),
      model: z.string().optional().describe('GPT model to use. Default: "gpt-4o-mini"'),
    }),
    function: async (args) => {
      try {
        consoleLogger.info('Tool::GenerateText called', { inputLength: args.input.length });

        const text = await generateText(args.input, args.model, apiKey);

        if (!text) {
          return { success: false, error: 'Failed to generate text' };
        }

        return {
          success: true,
          text,
          message: 'Text generated successfully',
        };
      } catch (error: any) {
        consoleLogger.error('Tool::GenerateText failed', error);
        return { success: false, error: error.message };
      }
    },
  });

/**
 * Tool: Generate Image Metadata
 * Generates title and description for an image based on the prompt or image content
 */
export const generateImageMetadataTool = (apiKey?: string) =>
  zodFunction({
    name: 'generate_image_metadata',
    description: 'Generate a creative title and detailed description for an image based on the prompt or image concept. Returns both title and description.',
    schema: z.object({
      prompt: z.string().describe('The image prompt or concept to generate metadata for'),
      style: z.string().optional().describe('Optional style hint for the metadata (e.g., "creative", "professional", "poetic")'),
    }),
    function: async (args) => {
      try {
        consoleLogger.info('Tool::GenerateImageMetadata called', { promptLength: args.prompt.length });

        const style = args.style || 'creative';
        const metadataPrompt = `Based on this image concept: "${args.prompt}"

Generate a ${style} title and description for this image.

Requirements:
- Title: Short, catchy, and descriptive (5-8 words max)
- Description: Engaging description that captures the essence (2-3 sentences)

Format your response EXACTLY as:
Title: [your title here]
Description: [your description here]`;

        const response = await generateText(metadataPrompt, 'gpt-4o-mini', apiKey);

        if (!response) {
          return { success: false, error: 'Failed to generate metadata' };
        }

        // Parse title and description from response
        const titleMatch = response.match(/Title:\s*(.+?)(?:\n|$)/i);
        const descMatch = response.match(/Description:\s*(.+?)$/is);

        const title = titleMatch ? titleMatch[1].trim() : `Generated: ${args.prompt.substring(0, 50)}`;
        const description = descMatch ? descMatch[1].trim() : args.prompt;

        consoleLogger.info('Successfully generated image metadata', {
          titleLength: title.length,
          descriptionLength: description.length,
        });

        return {
          success: true,
          title,
          description,
          message: 'Image metadata generated successfully',
        };
      } catch (error: any) {
        consoleLogger.error('Tool::GenerateImageMetadata failed', error);
        return { success: false, error: error.message };
      }
    },
  });

/**
 * Tool: Publish Image to Gallery
 * Publishes a generated image to the user's gallery with title and description
 */
export const publishImageTool = () =>
  zodFunction({
    name: 'publish_image',
    description: 'Publish a generated image to the gallery with title, description, and optional tags. This saves the image permanently to the user\'s account.',
    schema: z.object({
      imageUrl: z.string().describe('The URL or blob URL of the image to publish'),
      title: z.string().describe('The title for the image'),
      description: z.string().optional().describe('Optional description for the image'),
      tags: z.array(z.string()).optional().describe('Optional array of tags for the image'),
      prompt: z.string().optional().describe('The prompt used to generate the image'),
    }),
    function: async (args) => {
      try {
        consoleLogger.info('Tool::PublishImage called', { title: args.title });

        // Note: This is a placeholder. The actual publishing logic needs to be
        // implemented in the component that calls runTools, as it requires
        // access to Supabase client, user context, and File handling.
        // The tool returns the data needed for publishing.

        return {
          success: true,
          publishData: {
            imageUrl: args.imageUrl,
            title: args.title,
            description: args.description || '',
            tags: args.tags || [],
            prompt: args.prompt || '',
          },
          message: 'Image ready to publish. Please confirm publication in the UI.',
          requiresConfirmation: true,
        };
      } catch (error: any) {
        consoleLogger.error('Tool::PublishImage failed', error);
        return { success: false, error: error.message };
      }
    },
  });

// ====================================================================
// TOOL PRESETS
// ====================================================================

export interface ToolPreset {
  name: string;
  description: string;
  model: string;
  tools: RunnableToolFunctionWithParse<any>[];
  systemPrompt?: string;
}


/**
 * Create a simple custom preset using the preset type mapping
 */
export const createSimplePreset = (
  type: PresetType,
  systemPrompt: string,
  apiKey?: string
): ToolPreset => ({
  name: `Custom ${type}`,
  description: type,
  model: 'openai/gpt-5.2',
  tools: PRESET_TOOLS[type](apiKey),
  systemPrompt,
});

/**
 * Create tool presets with API key
 */
export const createToolPresets = (apiKey?: string, userId?: string, addLog?: LogFunction): Record<string, ToolPreset> => ({
  'image-wizard': {
    name: 'Image Generation Wizard',
    description: 'Optimize → generate → metadata',
    model: 'openai/gpt-5.2',
    tools: PRESET_TOOLS['optimize-generate'](apiKey),
    systemPrompt: `You are an AI image generation assistant. Your role is to:
1. Optimize prompts for better results
2. Generate images using optimized prompts
3. Create metadata (title + description)

Execute these steps automatically. Do NOT publish - user handles publishing.`,
  },

  'speech-to-image': {
    name: 'Speech to Image',
    description: 'Complete workflow: transcribe audio → optimize prompt → generate image',
    model: 'openai/gpt-5.2',
    tools: [
      transcribeAudioTool(apiKey),
      optimizePromptTool(apiKey),
      generateImageTool(apiKey),
    ],
    systemPrompt: `You are an AI assistant that converts speech to images. Your workflow:
1. Transcribe audio input to text (using transcribe_audio tool)
2. Optimize the transcribed text as an image prompt (using optimize_prompt tool)
3. Generate an image from the optimized prompt (using generate_image tool)
4. Provide clear feedback at each step

Execute all steps automatically when given audio input.`,
  },

  'text-to-image': {
    name: 'Text to Image',
    description: 'Optimize → generate → metadata',
    model: 'openai/gpt-5.2',
    tools: PRESET_TOOLS['optimize-generate'](apiKey),
    systemPrompt: `You are a text-to-image generation assistant. 
- Optimize prompts and generate images
- Create metadata automatically
- Do NOT publish - user handles that`,
  },


  'smart-generation': {
    name: 'Smart Generation',
    description: 'Optimize → generate → metadata (no publish)',
    model: 'openai/gpt-5.2',
    tools: PRESET_TOOLS['optimize-generate'](apiKey),
    systemPrompt: `You are an intelligent image generation assistant.

Workflow: Optimize prompt → Generate image → Create metadata

Execute automatically. Do NOT publish - user handles publishing.
Keep responses brief.`,
  },

  'auto-publish': {
    name: 'Auto-Publish Workflow',
    description: 'Optimize → generate → metadata → publish (full automation)',
    model: 'openai/gpt-5.2',
    tools: PRESET_TOOLS['generate-publish'](apiKey),
    systemPrompt: `You are an auto-publishing assistant.

Workflow: Optimize → Generate → Metadata → Publish

Execute all steps automatically. Always include metadata.`,
  },

  'metadata-generator': {
    name: 'Metadata Generator',
    description: 'Generate title and description for image concepts or existing images',
    model: 'openai/gpt-5.2',
    tools: [
      generateImageMetadataTool(apiKey),
    ],
    systemPrompt: `You are a creative metadata generator for images.
Your job is to create engaging titles and descriptions that capture the essence of the image.

For titles: Make them short, catchy, and memorable (5-8 words)
For descriptions: Create 2-3 sentences that are engaging and descriptive

Be creative and match the style of the image concept.`,
  },

  'metadata-only': {
    name: 'Metadata Only',
    description: 'Only generate title and description',
    model: 'openai/gpt-5.2',
    tools: PRESET_TOOLS['metadata-only'](apiKey),
    systemPrompt: `Generate title and description for the prompt.
Title: 5-8 words. Description: 2-3 sentences.`,
  },
  'page-generator': {
    name: 'Page Generator',
    description: 'Generate a complete page with text, images, and metadata from a single voice command.',
    model: 'openai/gpt-5.2',
    tools: [
      generateTextWithImagesTool(userId || 'anonymous-user', addLog),
      createPageTool(userId || 'anonymous-user', addLog),
    ],
    systemPrompt: `You are an AI assistant that creates well-structured pages with text and images. Your only task is to use the 'generate_text_with_images' tool to create rich, comprehensive markdown content based on the user's request. Include at least one relevant image unless otherwise specified.`,
  },
  'page-generator-text-only': {
    name: 'Page Generator (Text Only)',
    description: 'Generate a complete page with text from a single command, without images.',
    model: 'openai/gpt-5.2',
    tools: [
      createPageTool(userId || 'anonymous-user', addLog),
    ],
    systemPrompt: `You are an AI assistant that writes well-structured, comprehensive markdown documents. Based on the user's request, generate the full text content for a page, then call the 'create_page' tool with that content and a suitable title and tags. Your final response must be only the 'create_page' tool call.`,
  },
  'layout-generator': {
    name: 'Layout Generator',
    description: 'Generate widget layout fragments (containers + widgets) from a text description.',
    model: 'openai/gpt-5.2',
    tools: [
      createWidgetsTool(addLog),
    ],
    systemPrompt: `You are a layout generation assistant for a widget-based page editor. When the user describes a layout, call the create_widgets tool with the correct containers and widgets. Follow the widget schema exactly. Use appropriate columns, widget types, and props. Be creative with HTML widgets when no specific widget type fits. Always return valid JSON.`,
  }
});

// ====================================================================
// RUN TOOLS - Main Orchestration Function
// ====================================================================

export interface RunToolsOptions {
  prompt: string;
  preset?: string | ToolPreset;
  apiKey?: string;
  onMessage?: (message: any) => void;
  onToolCall?: (toolCall: any) => void;
  onContent?: (content: string) => void;
  model?: string;
  /** Provider name (e.g. 'openai', 'openrouter'). Determines which proxy base URL to use. */
  provider?: string;
  maxIterations?: number;
  userId?: string;
  images?: string[];
  toolsEnabled?: boolean;
  webSearchEnabled?: boolean;
  pageToolsEnabled?: boolean;
  imageToolsEnabled?: boolean;
  vfsToolsEnabled?: boolean;
  addLog?: LogFunction;
}

export interface RunToolsResult {
  success: boolean;
  content?: string;
  messages: any[];
  toolCalls: any[];
  error?: string;
}

/**
 * Run OpenAI with tools - main orchestration function
 * Based on ref/run-tools.ts
 * 
 * @example
 * // Use preset
 * const result = await runTools({
 *   prompt: "Create a beautiful sunset over mountains",
 *   preset: "image-wizard"
 * });
 * 
 * @example
 * // Custom tools
 * const result = await runTools({
 *   prompt: "Generate an image of a cat",
 *   preset: {
 *     name: "custom",
 *     model: "gpt-4o-mini",
 *     tools: [generateImageTool()],
 *     systemPrompt: "You are a helpful assistant"
 *   }
 * });
 */
export const runTools = async (options: RunToolsOptions): Promise<RunToolsResult> => {
  const {
    prompt,
    preset,
    apiKey,
    onMessage,
    onToolCall,
    onContent,
    maxIterations = 10,
    userId,
    images,
    addLog,
  } = options;

  const logger = addLog ? {
    debug: (m: string, d?: any) => addLog('debug', `[OPENAI] ${m}`, d),
    info: (m: string, d?: any) => addLog('info', `[OPENAI] ${m}`, d),
    warn: (m: string, d?: any) => addLog('warn', `[OPENAI] ${m}`, d),
    error: (m: string, d?: any) => addLog('error', `[OPENAI] ${m}`, d),
  } : consoleLogger;


  const messages: any[] = [];
  const toolCalls: any[] = [];

  try {
    // Get preset configuration (needed for model fallback)
    const presets = createToolPresets(apiKey, userId, addLog);
    const presetConfig: ToolPreset =
      typeof preset === 'string'
        ? presets[preset] || { ...presets['image-wizard'] }
        : preset ? { ...preset } : { ...presets['image-wizard'] };
    // Clone tools array to avoid modifying shared preset object
    presetConfig.tools = [...presetConfig.tools];

    // Determine effective provider — auto-detect OpenRouter from model format (contains '/')
    const effectiveModel = options.model || presetConfig.model;
    const effectiveProvider = options.provider
      || (effectiveModel.includes('/') ? 'openrouter' : 'openai');

    // Create client — route through the correct proxy based on provider
    let client: OpenAI | null = null;

    if (effectiveProvider === 'openrouter') {
      // OpenRouter models (e.g. 'google/gemini-2.5-pro') need the OpenRouter proxy
      let token: string | undefined = undefined;
      try {
        token = await getZitadelToken() ?? undefined;
      } catch { }
      if (!token) {
        return {
          success: false,
          messages,
          toolCalls,
          error: 'No authentication token available for OpenRouter',
        };
      }
      client = new OpenAI({
        apiKey: token,
        baseURL: `${serverUrl}/api/openrouter/v1`,
        dangerouslyAllowBrowser: true,
      });
    } else {
      // Default: OpenAI proxy
      client = await createOpenAIClient(apiKey);
    }

    if (!client) {
      return {
        success: false,
        messages,
        toolCalls,
        error: 'Failed to create AI client - no API key available',
      };
    }



    // Inject extra tools based on options
    if (options.webSearchEnabled) {
      const { webSearchTool, markdownScraperTool } = await import('@/modules/ai/searchTools');
      presetConfig.tools.push(webSearchTool(logger.info));
      presetConfig.tools.push(markdownScraperTool(logger.info));
      logger.info('Injected Web Search and Markdown Scraper tools');
    }
    
    // Determine effective provider — auto-detect OpenRouter from model format (contains '/')
    // Note: If we use openrouter, we might need to add special tools, but for function calling we just pass them.

    logger.info('Using preset', {
      name: presetConfig.name,
      model: presetConfig.model,
      toolCount: presetConfig.tools.length,
      toolsEnabled: options.toolsEnabled,
      webSearchEnabled: options.webSearchEnabled,
      pageToolsEnabled: options.pageToolsEnabled,
      vfsToolsEnabled: options.vfsToolsEnabled
    });

    // Build messages
    const initialMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (presetConfig.systemPrompt) {
      initialMessages.push({
        role: 'system',
        content: presetConfig.systemPrompt,
      });
    }

    // Handle multimodal input if images are provided
    if (images && images.length > 0) {
      logger.info('Adding images to request', { count: images.length });

      const content: any[] = [
        { type: "text", text: prompt }
      ];

      images.forEach(url => {
        content.push({
          type: "image_url",
          image_url: {
            url,
            detail: "auto"
          }
        });
      });

      initialMessages.push({
        role: 'user',
        content: content,
      });
    } else {
      initialMessages.push({
        role: 'user',
        content: prompt,
      });
    }

    // Run tools
    const runner = client.chat.completions
      .runTools({
        model: options.model || presetConfig.model,
        messages: initialMessages,
        tools: presetConfig.tools
      });

    logger.info('RunTools started', {
      prompt: prompt.substring(0, 100),
      preset: typeof preset === 'string' ? preset : 'custom',
      model: options.model || presetConfig.model,
      toolCount: presetConfig.tools.length,
      initialMessages
    });

    await runner.done();

    const finalMessages = runner.messages;
    const finalContent = await runner.finalContent();

    // Manually reconstruct tool calls with their output from the message history
    // This is more reliable than depending on the runner's final state.
    const completedToolCalls = finalMessages
      .filter((msg): msg is OpenAI.Chat.Completions.ChatCompletionMessage & { tool_calls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] } => msg.role === 'assistant' && !!msg.tool_calls)
      .flatMap(msg => msg.tool_calls);

    for (const toolCall of completedToolCalls) {
      const toolOutputMessage = finalMessages.find(
        (msg): msg is OpenAI.Chat.Completions.ChatCompletionMessage => msg.role === 'tool' && msg.tool_call_id === toolCall.id
      );
      if (toolOutputMessage && 'function' in toolCall && toolCall.function) {
        (toolCall.function as any).output = toolOutputMessage.content;
      }
    }

    logger.info('RunTools completed', {
      messageCount: finalMessages.length,
      toolCallCount: completedToolCalls.length,
      completedToolCalls,
      finalMessages: finalMessages,
      finalContent: finalContent,
    });

    // The SDK should handle parsing, but as a safeguard, parse stringified outputs.
    for (const toolCall of completedToolCalls) {
      if ('function' in toolCall && toolCall.function && 'output' in toolCall.function && typeof toolCall.function.output === 'string') {
        try {
          // Attempt to parse the output, but don't fail if it's just a raw string.
          const parsedOutput = JSON.parse(toolCall.function.output);
          (toolCall.function as any).output = parsedOutput;
        } catch (e) {
          logger.debug('Tool output was a non-JSON string.', { output: toolCall.function.output });
        }
      }
    }

    return {
      success: true,
      content: finalContent ?? undefined,
      messages: finalMessages,
      toolCalls: completedToolCalls,
    };
  } catch (error: any) {

    logger.error('RunTools failed', {
      error: error.message,
      prompt: prompt.substring(0, 100),
    });

    return {
      success: false,
      messages,
      toolCalls,
      error: error.message || 'Unknown error occurred',
    };
  }
};
