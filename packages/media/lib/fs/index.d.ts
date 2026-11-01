export { sync as read } from '@plastichub/fs/read';
export { sync as exists } from '@plastichub/fs/exists';
export { sync as dir } from '@plastichub/fs/dir';
export { sync as write } from '@plastichub/fs/write';
export declare const files: (dir: any, glob: any) => [];
export declare const images: (source: any) => any[];
export declare const forward_slash: (path: any) => any;
export declare function resize_images(files: any): Promise<any>;
