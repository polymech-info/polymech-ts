type OutputFormat = "mp3_22050_32" | "mp3_44100_32" | "mp3_44100_64" | "mp3_44100_96" | "mp3_44100_128" | "mp3_44100_192" | "pcm_16000" | "pcm_22050" | "pcm_24000" | "pcm_44100" | "ulaw_8000";
export interface TTSOptions {
    text: string;
    voiceId?: string;
    outputFormat?: OutputFormat;
    modelId?: string;
    languageCode?: string | null;
    voiceSettings?: {
        stability?: number;
        similarityBoost?: number;
        style?: number;
        useSpeakerBoost?: boolean;
    } | null;
    pronunciationDictionaryLocators?: Array<{
        pronunciationDictionaryId: string;
        versionId: string;
    }> | null;
    seed?: number | null;
    previousText?: string | null;
    nextText?: string | null;
    previousRequestIds?: string[] | null;
    nextRequestIds?: string[] | null;
    applyTextNormalization?: 'auto' | 'on' | 'off';
    applyLanguageTextNormalization?: boolean;
    usePvcAsIvc?: boolean;
    config?: any;
    api_key?: string;
    logger?: any;
}
export declare const generateSpeech: (options: TTSOptions) => Promise<Buffer>;
export {};
