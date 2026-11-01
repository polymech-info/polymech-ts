import { SolidworkOptions } from '../types.js';
export declare const convertFile: (src: any, target: any, view: string, onNode: (data: any) => void, options: SolidworkOptions, configuration: string) => Promise<any>;
export declare function convertFiles(file: any, targets: string[], view: any, onNode: (data: any) => void, options: SolidworkOptions): Promise<void | any[]>;
export declare const report: (data: any, dst: string) => any;
export declare const targets: (f: string, options: SolidworkOptions) => any[];
export declare function convert(options: SolidworkOptions): Promise<(void | any[])[]>;
