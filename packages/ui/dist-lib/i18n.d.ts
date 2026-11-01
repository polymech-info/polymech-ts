import { default as React, ReactNode } from 'react';
type LangCode = 'en' | 'fr' | 'sw' | 'de' | 'es' | 'it' | 'ja' | 'ko' | 'pt' | 'ru' | 'tr' | 'zh' | 'nl';
export declare const supportedLanguages: {
    code: string;
    name: string;
}[];
export declare const getCurrentLang: () => LangCode;
export declare const setLanguage: (langCode: LangCode) => void;
export declare const translate: (textKey: string, langParam?: LangCode) => string;
interface TProps {
    children: ReactNode;
}
declare const T: React.FC<TProps>;
export declare const getTranslationCache: (lang?: LangCode) => Record<string, string> | Record<string, Record<string, string>>;
export declare const downloadTranslations: (lang?: LangCode) => void;
export declare const getTranslationStatus: (lang?: LangCode) => Record<string, {
    loaded: boolean;
    keysCount: number;
}> | {
    loaded: boolean;
    keysCount: number;
};
export { T };
