import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { AppConfig } from '@polymech/shared';

let cachedAppConfig: AppConfig | null = null;

export const load = (): AppConfig => {
    if (cachedAppConfig) return cachedAppConfig;
    const configPath = path.resolve(process.cwd(), 'config', 'app-config.json');
    try {
        if (fs.existsSync(configPath)) {
            cachedAppConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            return cachedAppConfig!;
        }
    } catch (err) {
        logger.error({ err }, 'Failed to load app-config.json for footer');
    }
    return {} as AppConfig;
}
