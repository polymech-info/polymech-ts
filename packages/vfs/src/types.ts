import { PATH_INFO } from '@plastichub/osr-cli-commons'

export interface Options {
    src: string;
    srcInfo: PATH_INFO,
    dstInfo: PATH_INFO,
    dst?: string;
    format?: string[];
    alt: boolean;
    glob?: string;
    debug: boolean;
    verbose: boolean;
    skip: boolean;
    dry: boolean;
    report?: string;
    variables: any;
    sw?: string;
    script?: string;
    args?: string;
    hash: boolean;
}

