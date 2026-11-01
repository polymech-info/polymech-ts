import { createLogger } from '@/commons/logger.js';
import { createClient, supabase } from '@/commons/supabase.js';

// ─── Auth ────────────────────────────────────────────────────────────────

export interface TestAuth {
    token: string;
    userId: string;
}

export const testLogger = createLogger('auth-local');

export async function loginAdminUser(): Promise<TestAuth | null> {
    const TEST_EMAIL = process.env.TEST_EMAIL;
    const TEST_PASSWORD = process.env.TEST_PASSWORD;
    if (!TEST_EMAIL || !TEST_PASSWORD) {
        testLogger.warn('No TEST_EMAIL / TEST_PASSWORD — auth tests will be skipped');
        return null;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });
    if (error) throw new Error(`Supabase login failed: ${error.message}`);
    const auth: TestAuth = {
        token: data.session!.access_token,
        userId: data.user!.id,
    };
    testLogger.info({ userId: auth.userId }, 'Authenticated test user');
    return auth;
}

// ─── Secrets ─────────────────────────────────────────────────────────────

export async function getUserSecrets(userId: string) {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_KEY!;
    const supabase = createClient(url, key);

    const { data: userSecrets } = await supabase
        .from('user_secrets')
        .select('settings')
        .eq('user_id', userId)
        .maybeSingle();

    return userSecrets?.settings as any;
}
