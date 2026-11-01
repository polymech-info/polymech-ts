import { IConvertVideoOptions } from '../../../types';
import { E_AudioCodec, E_Codec, E_Format } from '../video';
export declare const frames: (src: any, dst: any, onNode: any, options?: {
    fps: number;
}) => Promise<void>;
export declare const CONVERTERS: {
    '.mp3': (inputPath: string, outputPath: string) => Promise<void>;
    '.jpg': (src: any, dst: any, onNode: any, options?: {
        fps: number;
    }) => Promise<void>;
};
export declare const converter: (file: string) => any;
export declare const convertFile: (file: any, target: any, onNode: (data: any) => void, options: IConvertVideoOptions) => Promise<any>;
export declare function _convert(file: any, targets: string[], onNode: (data: any) => void, options: IConvertVideoOptions): Promise<any[]>;
export declare const convert: (options: IConvertVideoOptions) => Promise<void>;
export declare const merge: (options: IConvertVideoOptions) => Promise<unknown>;
export interface VideoOptions {
    frameRate?: number;
    videoCodec?: keyof typeof E_Codec;
    audioCodec?: keyof typeof E_AudioCodec;
    format?: keyof typeof E_Format;
}
export declare const createVideoFromImages: (src: string, target: any, onNode: any, audio: any, { frameRate, videoCodec, audioCodec, format, }: VideoOptions) => Promise<unknown>;
