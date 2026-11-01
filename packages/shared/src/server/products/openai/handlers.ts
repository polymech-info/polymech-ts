import { Context } from 'hono';
import { logger } from '../../commons/logger.js';
import { createClient } from '@supabase/supabase-js';

// Helper to get Supabase credentials (copied from auth middleware logic)
const getSupabaseCredentials = () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
        throw new Error('Supabase credentials missing via process.env');
    }
    return { url, key };
};

export async function handleChatCompletions(c: Context) {
    const userId = c.get('userId');
    if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        // 1. Fetch User API Key
        const { url, key } = getSupabaseCredentials();
        const supabase = createClient(url, key);

        const { data: userSecrets, error: secretsError } = await supabase
            .from('user_secrets')
            .select('settings')
            .eq('user_id', userId)
            .maybeSingle();

        if (secretsError) {
            logger.error({ err: secretsError, userId }, 'Failed to fetch user secrets');
            return c.json({ error: 'Internal Server Error' }, 500);
        }

        // Add debug logging
        logger.debug({ userId, hasSecrets: !!userSecrets, settings: userSecrets?.settings }, 'Checking for OpenAI API key');

        const apiKey = (userSecrets?.settings as any)?.api_keys?.openai_api_key;

        if (!apiKey) {
            logger.warn({ userId }, 'Missing OpenAI API key in user_secrets');
            return c.json({ error: 'OpenAI API key not found. Please add it to your profile settings.' }, 400);
        }

        // 2. Prepare Request to OpenAI
        const body = await c.req.json();

        // Log request (sanitize sensitive data)
        logger.info({ userId, model: body.model }, 'Proxying OpenAI request');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        };

        // 3. Make Request to OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        // 4. Handle Response
        if (!response.ok) {
            const errorText = await response.text();
            logger.error({ status: response.status, errorText, userId }, 'OpenAI API error');
            // Try to parse error as JSON to return proper error object
            try {
                const errorJson = JSON.parse(errorText);
                return c.json(errorJson, response.status as any);
            } catch (e) {
                return c.text(errorText, response.status as any);
            }
        }

        // 5. Stream Response if requested
        if (body.stream) {
            // Need to handle streaming response properly in Hono/Node
            // We can return the body stream directly

            return new Response(response.body, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                }
            });
        }

        const data = await response.json();
        return c.json(data);

    } catch (err: any) {
        logger.error({ err, userId }, 'OpenAI Proxy handler failed');
        return c.json({ error: 'Internal Server Error' }, 500);
    }
}
