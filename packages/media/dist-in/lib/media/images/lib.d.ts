import sharp from 'sharp';
export declare const fileAsBuffer: (path: string) => Buffer<ArrayBufferLike>;
export declare const base64ToBuffer: (b64string: string) => Promise<Buffer<ArrayBuffer>>;
export declare const imageToBase64: (imagePath: string) => Promise<string>;
export declare const meta: (file: any, image: sharp.Sharp) => Promise<sharp.Metadata | null>;
