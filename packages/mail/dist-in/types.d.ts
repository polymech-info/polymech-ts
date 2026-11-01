import { Hash } from '@polymech/core';
import { PATH_INFO } from '@polymech/commons';
import { SendMailOptions } from 'nodemailer';
export interface ITransportOptions {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}
export type IOptions = {
    alt?: boolean;
    config?: any;
    cwd?: string;
    root?: string;
    debug?: boolean;
    verbose?: boolean;
    dry?: boolean;
    dst?: string;
    dstInfo?: PATH_INFO;
    env?: string;
    cache?: boolean;
    src?: string;
    srcInfo?: PATH_INFO;
    stdout?: boolean;
    variables?: Hash<any>;
    key?: string;
    logLevel?: string;
    transport?: string;
    from?: string;
    subject?: string;
    html?: string;
    to?: string;
    attachments?: SendMailOptions['attachments'];
};
export type INodeMailer = IOptions & {};
