/// <reference types="node" resolution-mode="require"/>
import { IDiscourseUser } from '../../';
export declare const fileAsBuffer: (path: string) => Buffer;
export declare const cacheCategories: (options: any, discourse: Discourser) => Promise<any>;
export declare const cacheTopics: (options: any, discourse: Discourser) => Promise<void>;
export declare const _getForumUsers: (d: Discourser, page: any, detail: any) => any;
export declare const getForumUsers: (d: any, detail: any) => Promise<IDiscourseUser[]>;
export declare const cacheUsers: (options: any, discourse: Discourser) => Promise<IDiscourseUser[]>;
export declare const cacheTags: (options: any, discourse: Discourser) => Promise<any>;
