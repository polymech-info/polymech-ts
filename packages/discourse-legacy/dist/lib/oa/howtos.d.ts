import { IOAHowtoImport } from '../../';
export declare const mergeLatest: (discorse: any, options: IOptions, oa_howtos: IOAHowtoImport[]) => IOAHowtoImport[];
export declare const read_fragments: (src: any, config: any, prefix?: string, context?: string) => any;
export declare function howto_content(howto: IOAHowtoImport, folder: string, fragments: any, templates: any): Promise<any>;
export declare const createHowtoTopic: (discourse: any, howto: IOAHowtoImport, create?: boolean) => Promise<boolean>;
export declare const importHowto: (discorse: any, howto: IOAHowtoImport) => Promise<boolean>;
export declare const importHowtos: (discorse: any, options: IOptions, howtos: IOAHowtoImport[]) => Promise<any>;
export declare const updateHowto: (discourse: Discourser, howto: IOAHowtoImport, options: IOptions) => Promise<boolean>;
export declare const updateHowtos: (discorse: any, options: IOptions, howtos: IOAHowtoImport[]) => Promise<any>;
