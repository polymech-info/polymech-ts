export declare const createTopic: (discourse: Discourser, options: IOptionsSync, content: any) => Promise<void>;
export declare const updateTopic: (discourse: Discourser, options: IOptionsSync, topic_id: any, content: any) => Promise<boolean>;
export declare const syncComponent: (options: IOptionsSync) => Promise<void>;
export declare const sync: (options: IOptionsSync) => Promise<void>;
