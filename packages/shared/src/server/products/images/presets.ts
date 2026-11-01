import { logger } from './logger.js';

export interface ImagePreset {
    width?: number;
    height?: number;
    format?: string;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

const DEFAULTS: Record<string, ImagePreset> = {
    'desktop:thumb': { width: 150, height: 150, format: 'avif', fit: 'cover' },
    'desktop:medium': { width: 800, format: 'avif', fit: 'inside' },
    'desktop:large': { width: 1920, format: 'avif', fit: 'inside' },
};

export const getPresets = (): Record<string, ImagePreset> => {
    let envPresets = {};
    if (process.env.IMAGE_PRESETS) {
        try {
            envPresets = JSON.parse(process.env.IMAGE_PRESETS);
        } catch (e) {
            logger.warn('Failed to parse IMAGE_PRESETS from env');
        }
    }
    return { ...DEFAULTS, ...envPresets };
};
