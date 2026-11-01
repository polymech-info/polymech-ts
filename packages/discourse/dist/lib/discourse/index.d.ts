import { IDiscourseConfig } from '@polymech/commons/types';
export declare const logger: any;
import PromisePool from 'native-promise-pool';
export declare const escape: (path: string) => string;
import { TPostStatus, TPostStatusUpdate, UserPreferencesUpdate } from './types';
import { Category, CategoriesResponse, PostsResponse, PostResponse, TopicResponse, TopicItem, CategoryResponse, PostItem, PostUpdateItem, IDiscourserConfig, Thread, PostModifier, FetchConfig, FetchOptions, ISearchResult, ICreateUserResponse, IUserDetail, TagsResponse, Tag, TopicUpdateBasicTopic } from './types';
import { IDiscourseUser } from '@polymech/commons';
import { IDImage } from '../oa/index';
/**
 * Discourser is an API Client for the [Discourse API](https://docs.discourse.org)
 * It special features are:
 * - TypeScript Types
 * - Respecting Rate Limits
 * - Optional Heavy Caching
 * - Post Modifiers (can be used for global find and replace across all posts on the forum)
 */
export declare class Discourser {
    readonly host: string;
    readonly key: string;
    readonly username: string;
    readonly cache?: string;
    readonly useCache?: boolean;
    readonly dry: boolean;
    readonly pool: PromisePool<any>;
    /**
     * Construct our Discourser instance
     * See {@link IDiscourserConfig} for available configuration.
     */
    constructor(config: IDiscourserConfig);
    /** Get the URL of a topic */
    getTopicURL(topic: TopicItem | TopicResponse | number): string;
    /** Fetch a discourse API URL, with rate limit concurrency and optional caching */
    fetch<T>({ url, useCache, request }: FetchConfig): Promise<T>;
    /** Fetch a discourse API URL, with rate limit retries */
    private _post;
    /** Fetch a discourse API URL, with rate limit retries */
    private _fetch;
    /**
     * API Helper for {@link .search}
     * https://docs.discourse.org/#tag/Search/operation/search
     */
    search(query: string, params?: string, opts?: FetchOptions): Promise<ISearchResult>;
    /**
     * API Helper for {@link .getTags}
     */
    protected getTagsResponse(opts?: FetchOptions): Promise<TagsResponse>;
    /**
     * Fetch the whole information, for all categories of the forum
     */
    getTags(opts?: FetchOptions): Promise<Tag[]>;
    createTag(name: any): Promise<any>;
    /**
     * API Helper for {@link .getCategories}
     */
    protected getCategoriesResponse(opts?: FetchOptions): Promise<CategoriesResponse>;
    /**
     * Fetch the whole information, for all categories of the forum
     */
    getCategories(opts?: FetchOptions): Promise<Category[]>;
    /**
     * API Helper for {@link .getTopicItemsOfCategory}
     * Discourse does not provide an API for fetching category information for a specific category.
     * Instead, all that it provides is a way of getting the topics for a specific category.
     */
    protected getCategoryResponse(categoryID: number, opts?: FetchOptions): Promise<CategoryResponse>;
    /**
     * Fetch the partial information, for all topics of a specific category
     */
    getTopicItemsOfCategory(categoryID: number, opts?: FetchOptions): Promise<TopicItem[]>;
    /**
     * Fetch the partial information, for all topics of specific categoires
     */
    getTopicItemsOfCategories(categoryIDs: number[], opts?: FetchOptions): Promise<TopicItem[]>;
    /**
     * Fetch the partial information, for all topics of the forum
     */
    getTopicItems(opts?: FetchOptions): Promise<TopicItem[]>;
    /**
     * Fetch the whole information, for a specific topic of the forum
     */
    getTopic(id: number, opts?: FetchOptions): Promise<TopicResponse>;
    /**
     * Fetch the whole information, for all topics, or specific topics, of the forum
     */
    getTopics(topicIDs?: number[] | null, opts?: FetchOptions): Promise<TopicItem[] | TopicResponse[]>;
    updateTopicVisibility(topicID: number, listed?: boolean, visible?: TPostStatus): Promise<TPostStatusUpdate>;
    updateTopicTimestamp(topicID: number, timestamp: Date | string | number, token: string): Promise<any>;
    /**
     * API Helper for {@link .getPostItemsOfTopic}
     */
    protected getPostItemsOfTopicResponse(topicID: number, opts?: FetchOptions): Promise<PostsResponse>;
    _createUser(name: any, email: any, pUserGroup: any): Promise<ICreateUserResponse>;
    getUsers(page: any): Promise<IDiscourseUser>;
    getUser(id: any): Promise<IUserDetail>;
    /**
     * Fetch the partial information, for all posts of a specific topic
     */
    getPostItemsOfTopic(topicID: number, opts?: FetchOptions): Promise<PostItem[]>;
    /**
     * Fetch the partial information, for all posts of specific topics
     */
    getPostItemsOfTopics(topicIDs: number[], opts?: FetchOptions): Promise<PostItem[]>;
    /**
     * Fetch the partial information, for all posts of a specific category
     */
    getPostItemsOfCategory(categoryID: number, opts?: FetchOptions): Promise<PostItem[]>;
    /**
     * Fetch the partial information, for all posts of specific categories
     */
    getPostItemsOfCategories(categoryIDs: number[], opts?: FetchOptions): Promise<PostItem[]>;
    /**
     * Fetch the partial information, for all posts of the forum
     */
    getPostItems(opts?: FetchOptions): Promise<PostItem[]>;
    /**
     * Fetch the whole information, for a specific post of the forum
     */
    getPost(id: number, opts?: FetchOptions): Promise<PostResponse>;
    createReply(postId: any, raw: any, category: any): Promise<unknown>;
    changeOwner(postId: string | number, topicId: string | number, owner: string): Promise<unknown>;
    createUser(data: any): Promise<ICreateUserResponse>;
    getUserByUsername(username: any): Promise<IUserDetail>;
    setUserAvatar(user_name: any, upload_id: any): Promise<PostResponse[]>;
    updateUser(user_name: any, args: any): Promise<PostResponse[]>;
    updateGroup(user_name: any, group: any): Promise<any>;
    upload(userId: any, file: any): Promise<IDImage[]>;
    uploadFile(userId: any, file: any): Promise<PostResponse[]>;
    /**
     * Fetch the whole information, for all posts, or specific posts, of the forum
     */
    getPosts(postIDs?: number[] | null, opts?: FetchOptions): Promise<PostResponse[]>;
    createPost(title: string, raw: string, category: number): Promise<unknown>;
    /**
     * Update a post with the content
     * @param postID the identifier of the post to update
     * @param content the new raw content for the post
     * @param reason the reason, if provided, for modifying the post
     * @param old if the old raw content is provided, then the update verified that you are working with the latest post content before applying the update
     */
    updatePost(postID: number, content: string, reason?: string, old?: string): Promise<PostUpdateItem>;
    /**
     * Update post meta
     */
    updateTopic(postId: number, category_id: number, title: string, tags?: string[]): Promise<TopicUpdateBasicTopic>;
    rebakePost(postID: number): Promise<any>;
    /**
     * Modify a post using a modifier
     */
    modifyPost(post: PostResponse, modifier: PostModifier): Promise<PostUpdateItem | null>;
    /**
     * Modify a post (via its post identifier) using a modifier
     */
    modifyPostID(post: number, modifier: PostModifier): Promise<any>;
    /**
     * Modify a post (via fetching the whole post from the partial post identifier) using a modifier
     */
    modifyPostItem(post: PostItem, modifier: PostModifier): Promise<any>;
    /**
     * Run the post modifier on all specified posts
     */
    modifyPosts(posts: PostResponse[], modifier: PostModifier): Promise<PostUpdateItem[]>;
    /**
     * Fetch the partial information, for all posts of a specific topic
     * Alias of {@link .getPostItemsOfTopic}.
     */
    getThread(topicID: number, opts?: FetchOptions): Promise<Thread>;
    /**
     * Fetch the partial information, for all posts of specific topics, grouped by topic
     */
    getThreads(topicIDs: number[], opts?: FetchOptions): Promise<Thread[]>;
    /**
     * Fetch the partial information, for all posts of specific categories, grouped by topic
     */
    getThreadsOfCategory(categoryID: number, opts?: FetchOptions): Promise<Thread[]>;
    /**
     * Fetch the partial information, for all posts of specific categories, grouped by category, then topic
     */
    getThreadsOfCategories(categoryIDs: number[], opts?: FetchOptions): Promise<Thread[][]>;
    updateUserProfile(userId: any, prefs: UserPreferencesUpdate): Promise<any>;
}
export declare const Instance: (config?: IDiscourseConfig, key?: EDiscourseConfigKey) => Discourser;
