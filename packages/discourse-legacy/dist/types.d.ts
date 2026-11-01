import { PATH_INFO, SRC_VARIABLES } from '@polymech/commons';
import { IBaseOptions as IOSRLBaseOptions } from '@plastichub/osrl';
import { EDiscourseConfigKey } from 'lib/discourse/constants';
import { IProcessingNode } from '@polymech/fs/interfaces';
import { TFindFilter } from '@plastichub/osr-fs-utils';
export interface Hash<T> {
    [id: string]: T;
}
export type IOptions = {
    src: string;
    id: string;
    cat: string;
    track: string;
    variables: Hash<any>;
    cwd: string;
    env: string;
    verb: string;
    debug: boolean;
    disabled: boolean;
    dry?: boolean;
    all?: boolean;
    stdout: boolean;
    pathVariables: Hash<any>;
};
/**
 * An enumeration to narrow a conflict resolve to a single item or for all following conflicts.
 *
 * @export
 * @enum {number}
 */
export declare enum EResolve {
    /**
     * Always will use the chose conflict settings for all following conflicts.
     */
    ALWAYS = 0,
    /**
     * 'This' will use the conflict settings for a single conflict so the conflict callback will be triggered again for the next conflict.
     */
    THIS = 1
}
/**
 * The possible modes to resolve a conflict during a sync
 *
 * @export
 * @enum {number}
 */
export declare enum EResolveMode {
    SKIP = 0,
    OVERWRITE = 1,
    IF_NEWER = 2,
    IF_SIZE_DIFFERS = 3,
    THROW = 4,
    RETRY = 5,
    ABORT = 6
}
export interface IConflictSettings {
    /**
     * How to resolve this conflict/error.
     *
     * @type {EResolveMode}
     * @memberOf IConflictSettings
     */
    overwrite: EResolveMode;
    /**
     * The scope of this conflict resolver: always or this.
     *
     * @type {EResolve}
     * @memberOf IConflictSettings
     */
    mode: EResolve;
    /**
     * Track the origin error type for this settings.
     *
     * @type {string}
     * @memberOf IConflictSettings
     */
    error?: string;
}
export type EMergeConflictMode = 'theirs' | 'mine';
export type EPostType = 'post' | 'reply';
export type ISyncNodeReport = IProcessingNode & {};
export interface IDiscoursePostBaseOptions {
    title?: string;
    id?: string;
    cat?: string | number;
    tags?: string;
    owner?: string | number;
    timestamp?: string | number | Date;
    uploadLocal?: boolean;
    uploadRemote?: boolean;
    yaml?: boolean;
    post_id?: number;
    topic_id?: number;
    type?: EPostType;
    user_name?: string;
}
export type IOptionsSync = IDiscoursePostBaseOptions & IOSRLBaseOptions & {
    debug?: boolean;
    verbose?: boolean;
    logLevel?: string;
    skip?: boolean;
    alt?: boolean;
    src?: string;
    verb: string;
    cache?: boolean;
    filter?: TFindFilter | string;
    config?: string | EDiscourseConfigKey;
    pathVariables?: Hash<any>;
    variables?: SRC_VARIABLES;
    repo?: string;
    root?: string;
    product_root?: string;
    srcInfo?: PATH_INFO;
    post_id?: number;
    topic_id?: number;
};
export type IOptionsSyncComponent = IOptionsSync & {
    format?: string;
    module?: string;
    plugins?: string;
    onCompiled?: () => void;
    onCompileDone?: () => void;
    cache?: boolean;
    skip?: boolean;
};
export interface IDBConfig {
    user: string;
    password: string;
    database: string;
    host: string;
    prefix: string;
}
export interface IDiscourseUser {
    id: number;
    username: string;
    name: string;
    avatar_template: string;
    active: boolean;
    admin: boolean;
    moderator: boolean;
    last_seen_at: any;
    last_emailed_at: string;
    created_at: string;
    last_seen_age: any;
    last_emailed_age: number;
    created_at_age: number;
    trust_level: number;
    manual_locked_trust_level: any;
    flag_level: number;
    title: any;
    time_read: number;
    staged: boolean;
    days_visited: number;
    posts_read_count: number;
    topics_entered: number;
    post_count: number;
    detail: any;
}
