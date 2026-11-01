
export interface VideoPreset {
    id: string;
    description: string;
    format: 'mp4' | 'webm';
    videoBitrate?: string; // e.g. '1000k'
    audioBitrate?: string; // e.g. '128k'
    size?: string; // e.g. '1920x1080' or '1280x?'
    fps?: number;
}

export const presets: Record<string, VideoPreset> = {
    'web-1080p': {
        id: 'web-1080p',
        description: '1080p Web-optimized MP4',
        format: 'mp4',
        videoBitrate: '2500k',
        audioBitrate: '128k',
        size: '1920x1080'
    },
    'web-720p': {
        id: 'web-720p',
        description: '720p Web-optimized MP4',
        format: 'mp4',
        videoBitrate: '1500k',
        audioBitrate: '128k',
        size: '1280x720'
    },
    'mobile-480p': {
        id: 'mobile-480p',
        description: '480p Mobile-friendly MP4',
        format: 'mp4',
        videoBitrate: '800k',
        audioBitrate: '96k',
        size: '854x480'
    },
    'webm-720p': {
        id: 'webm-720p',
        description: '720p WebM (VP9/Opus)',
        format: 'webm',
        videoBitrate: '1200k',
        audioBitrate: '128k',
        size: '1280x720'
    },
    'original': {
        id: 'original',
        description: 'Original Resolution',
        format: 'mp4',
        videoBitrate: '2500k',
        audioBitrate: '128k'
    }
};

export const getPreset = (name: string): VideoPreset => {
    return presets[name] || presets['original'];
};
