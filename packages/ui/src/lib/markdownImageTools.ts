/**
 * Markdown Image Tools
 * Tools for generating and embedding images in markdown content
 * 
 * Uses raw JSON Schema for OpenAI compatibility (same pattern as tools-layout.ts)
 */

import type { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction';
import { createImageTool } from '@/modules/ai/imageTools';


type LogFunction = (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) => void;
const defaultLog: LogFunction = (level, message, data) => console.log(`[${level}] ${message}`, data);

// ── Input types ──

interface GenerateMarkdownImageInput {
  prompt: string;
  altText?: string;
  caption?: string;
  model?: string;
}

interface GenerateTextWithImagesInput {
  content: string;
  imagePrompts?: Array<{
    prompt: string;
    position: 'top' | 'middle' | 'bottom' | 'inline';
    altText?: string;
    caption?: string;
  }>;
  model?: string;
}

/**
 * Tool: Generate Markdown Image
 * Generates an image and returns markdown with embedded image.
 * Uses raw JSON Schema parameters for OpenAI compatibility.
 */
export const generateMarkdownImageTool = (userId: string, addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<GenerateMarkdownImageInput> => ({
  type: 'function',
  function: {
    name: 'generate_markdown_image',
    description: 'Generate an image from a text prompt and return markdown code with the embedded image. The image will be uploaded to temporary storage and embedded using proper markdown image syntax.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The text prompt describing the image to generate' },
        altText: { type: 'string', description: 'Alt text for the image (defaults to prompt)' },
        caption: { type: 'string', description: 'Optional caption to display below the image' },
        model: { type: 'string', description: 'Image generation model in format "provider/model-name". Default: "google/gemini-3-pro-image-preview"' },
      },
      required: ['prompt'],
    } as any,
    parse(input: string): GenerateMarkdownImageInput {
      return JSON.parse(input);
    },
    function: async (args) => {
      try {
        addLog('info', 'Tool::GenerateMarkdownImage called', {
          prompt: args.prompt.substring(0, 100)
        });

        const imageTool = createImageTool(userId, addLog, args.model);
        const imageResultRaw = await (imageTool.function.function as any)({
          prompt: args.prompt,
          altText: args.altText,
          caption: args.caption,
        });
        const imageResult = typeof imageResultRaw === 'string' ? JSON.parse(imageResultRaw) : imageResultRaw;
        if (!imageResult?.success || !imageResult?.imageUrl) {
          return {
            success: false,
            error: imageResult?.error || 'Failed to generate or upload image',
            markdown: imageResult?.markdown || `_Image generation failed for: "${args.prompt}"_`
          };
        }

        // Build markdown with proper image syntax
        const altText = args.altText || args.prompt;
        const caption = args.caption ? `\n*${args.caption}*` : '';
        const markdown = `![${altText}](${imageResult.imageUrl})${caption}`;

        addLog('info', 'Image generated and embedded in markdown', {
          originalUrl: imageResult.imageUrl,
          markdownLength: markdown.length
        });

        return {
          success: true,
          markdown,
          imageUrl: imageResult.imageUrl,
          message: 'Image generated and embedded in markdown successfully'
        };
      } catch (error: any) {
        addLog('error', 'Tool::GenerateMarkdownImage failed', error);
        return {
          success: false,
          error: error.message,
          markdown: `_Error generating image: ${error.message}_`
        };
      }
    },
  },
});

/**
 * Tool: Generate Text with Images
 * Generates markdown content that can include both text and embedded images.
 * Uses raw JSON Schema parameters for OpenAI compatibility.
 */
export const generateTextWithImagesTool = (userId: string, addLog: LogFunction = defaultLog): RunnableToolFunctionWithParse<GenerateTextWithImagesInput> => ({
  type: 'function',
  function: {
    name: 'generate_text_with_images',
    description: 'Generate markdown content that includes both text and images. When you need to illustrate concepts or enhance the content, use this tool to generate relevant images and embed them in the markdown.',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The main text content in markdown format' },
        imagePrompts: {
          type: 'array',
          description: 'Optional array of images to generate and embed',
          items: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'Image generation prompt' },
              position: { type: 'string', enum: ['top', 'middle', 'bottom', 'inline'], description: 'Where to place the image in the content' },
              altText: { type: 'string', description: 'Alt text for the image' },
              caption: { type: 'string', description: 'Caption for the image' },
            },
            required: ['prompt', 'position'],
          },
        },
        model: { type: 'string', description: 'Image generation model. Default: "google/gemini-3-pro-image-preview"' },
      },
      required: ['content'],
    } as any,
    parse(input: string): GenerateTextWithImagesInput {
      return JSON.parse(input);
    },
    function: async (args) => {
      try {
        addLog('info', 'Tool::GenerateTextWithImages called', {
          contentLength: args.content.length,
          imageCount: args.imagePrompts?.length || 0
        });

        let finalContent = args.content;

        // Generate and embed images if requested
        if (args.imagePrompts && args.imagePrompts.length > 0) {
          const markdownImageTool = generateMarkdownImageTool(userId, addLog);
          for (const imagePrompt of args.imagePrompts) {
            const imageResult = await (markdownImageTool.function.function as any)({
              prompt: imagePrompt.prompt,
              altText: imagePrompt.altText,
              caption: imagePrompt.caption,
              model: args.model,
            });

            const parsed = typeof imageResult === 'string' ? JSON.parse(imageResult) : imageResult;

            if (parsed.success && parsed.markdown) {
              // Embed image based on position
              switch (imagePrompt.position) {
                case 'top':
                  finalContent = `${parsed.markdown}\n\n${finalContent}`;
                  break;
                case 'bottom':
                  finalContent = `${finalContent}\n\n${parsed.markdown}`;
                  break;
                case 'middle':
                  // Insert in the middle of content
                  const lines = finalContent.split('\n');
                  const middleIndex = Math.floor(lines.length / 2);
                  lines.splice(middleIndex, 0, '', parsed.markdown, '');
                  finalContent = lines.join('\n');
                  break;
                case 'inline':
                default:
                  // Just append to content
                  finalContent = `${finalContent}\n\n${parsed.markdown}`;
                  break;
              }
            }
          }
        }

        return {
          success: true,
          content: finalContent,
          imageCount: args.imagePrompts?.length || 0,
          message: 'Content with images generated successfully'
        };
      } catch (error: any) {
        addLog('error', 'Tool::GenerateTextWithImages failed', error);
        return {
          success: false,
          error: error.message,
          content: args.content // Return original content on failure
        };
      }
    },
  },
});

/**
 * Create markdown-specific tool preset
 */
export const createMarkdownToolPreset = (userId: string, model: string = 'gpt-4o-mini', apiKey?: string, addLog: LogFunction = defaultLog) => ({
  name: 'Markdown with Images',
  description: 'Generate rich markdown content with embedded images',
  model,
  tools: [
    generateMarkdownImageTool(userId, addLog),
    generateTextWithImagesTool(userId, addLog),
  ],
  systemPrompt: `You are a creative markdown content generator with image generation capabilities.

When generating content:
1. Create engaging, well-formatted markdown text
2. Use proper markdown syntax (headers, lists, emphasis, etc.)
3. When the content would benefit from visual illustration, use the generate_markdown_image tool
4. For comprehensive content pieces, use generate_text_with_images to create rich content with embedded images
5. Always provide helpful alt text and captions for images
6. Place images strategically to enhance the content

Image generation guidelines:
- Use descriptive, detailed prompts for better image quality
- Consider the content context when generating images
- Provide meaningful captions that add value
- Use appropriate positioning (top, middle, bottom, inline)

Return ONLY raw markdown content with embedded images. Do NOT wrap in code blocks.`,
});
