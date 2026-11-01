export interface IImapConfig {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
}
export declare function getMessagesFromInboxWithFilter(imapConfig: IImapConfig, fromAddress?: string, toAddress?: string, subject?: string): Promise<any[]>;
export declare const draft: (subject: string, html: string, options: any) => Promise<void>;
