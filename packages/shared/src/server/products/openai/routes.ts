import { createRoute, z } from '@hono/zod-openapi';

export const postChatCompletionsRoute = createRoute({
    method: 'post',
    path: '/api/openai/v1/chat/completions',
    tags: ['OpenAI'],
    summary: 'Chat Completions Proxy',
    description: 'Proxies chat completion requests to OpenAI, injecting user API key.',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        model: z.string(),
                        messages: z.array(z.object({
                            role: z.string(),
                            content: z.any() // string or array (for multimodal)
                        })),
                        stream: z.boolean().optional(),
                        temperature: z.number().optional(),
                        top_p: z.number().optional(),
                        n: z.number().optional(),
                        presence_penalty: z.number().optional(),
                        frequency_penalty: z.number().optional(),
                        logit_bias: z.record(z.string(), z.number()).optional(),
                        user: z.string().optional(),
                        max_tokens: z.number().optional(),
                        response_format: z.any().optional(),
                        tools: z.array(z.any()).optional(),
                        tool_choice: z.any().optional(),
                    }).passthrough() // Allow other OpenAI params
                }
            }
        }
    },
    responses: {
        200: {
            description: 'Chat completion response',
            content: {
                'application/json': {
                    schema: z.any()
                },
                'text/event-stream': {
                    schema: z.string()
                }
            }
        },
        400: {
            description: 'Bad Request'
        },
        401: {
            description: 'Unauthorized'
        },
        500: {
            description: 'Internal Server Error'
        }
    }
});
