import { MODULE_NAME } from '../../constants.js'

import { CONFIG_DEFAULT } from '@polymech/commons'

import { IOSRConfig, IDiscourseConfig } from '@polymech/commons/types'

import { createLogger } from '@polymech/log'

const logger = createLogger(MODULE_NAME)

import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/write'
import { sync as exists } from '@polymech/fs/exists'

import PromisePool from 'native-promise-pool'


import { join } from 'path'
import * as _axios from 'axios'
const axios = (_axios as any).default || _axios
import * as fs from 'fs'
import * as path from 'path'
import * as _FormData from 'form-data'
const FormData: any = (_FormData as any).default || _FormData

import * as https from 'https'
import * as _fetch from 'isomorphic-unfetch'
const fetch = (_fetch as any).default || _fetch

export const escape = (path: string) =>
	path.replace(/[^\w]/g, '-').replace(/-+/, '-')

import { generate } from 'generate-password'

import { TPostStatus, TPostStatusUpdate, UserPreferencesUpdate } from './types.js'

// types
import {
	PostUpdateRequest,
	Category,
	CategoriesResponse,
	PostsResponse,
	PostResponse,
	TopicResponse,
	TopicItem,
	CategoryResponse,
	PostItem,
	PostUpdateResponse,
	PostUpdateItem,
	TopicUpdateTimestampRequest,
	TopicUpdateTimestampResponse,
	IDiscourserConfig,
	Thread,
	PostModifier,
	FetchConfig,
	FetchOptions,
	PostConfig,
	ISearchResult,
	ICreateUserResponse,
	IUserDetail,
	TagsResponse,
	Tag,
	TopicUpdateBasicTopic
} from './types.js';
import { IDiscourseUser } from '@polymech/commons'
import { EDiscourseConfigKey } from './constants.js'


/**
 * Discourser is an API Client for the [Discourse API](https://docs.discourse.org)
 * It special features are:
 * - TypeScript Types
 * - Respecting Rate Limits
 * - Optional Heavy Caching
 * - Post Modifiers (can be used for global find and replace across all posts on the forum)
 */
export class Discourser {
	readonly host: string
	readonly key: string
	readonly username: string
	readonly cache?: string
	readonly useCache?: boolean
	readonly dry: boolean
	readonly pool: PromisePool<any>

	/**
	 * Construct our Discourser instance
	 * See {@link IDiscourserConfig} for available configuration.
	 */
	constructor(config: IDiscourserConfig) {
		this.host = config.host
		this.key = config.key
		this.username = config.username
		this.cache = config.cache
		this.useCache = config.useCache
		this.dry = config.dry || false
		this.pool = new PromisePool(config.rateLimitConcurrency || 60)
	}

	/** Get the URL of a topic */
	getTopicURL(topic: TopicItem | TopicResponse | number): string {
		if (typeof topic === 'number') {
			return `${this.host}/t/${topic}`
		}
		return `${this.host}/t/${topic.slug}/${topic.id}`
	}

	/** Fetch a discourse API URL, with rate limit concurrency and optional caching */
	async fetch<T>({ url, useCache, request }: FetchConfig): Promise<T> {
		// check if cache is enabled
		useCache = false
		const cache =
			this.cache &&
			(request?.method || 'get') === 'get' &&
			join(this.cache, escape(url))
		// check if we should and can read from cache
		if (
			cache &&
			this.useCache !== false &&
			useCache !== false &&
			(exists(cache))
		) {
			const result = read(cache, 'json')
			return (result as unknown) as T
		}
		// fetch
		const result = await this.pool.open(() => this._fetch<T>({ url, request }))
		// write to cache if cache is enabled
		if (cache) {
			write(cache, result as any)
		}
		// return the result
		return result
	}


	/** Fetch a discourse API URL, with rate limit retries */
	private async _post<T>(url, data): Promise<T> {
		const opts = {
			headers: {
				'Api-Key': this.key,
				'Api-Username': this.username,
			},
		}
		let d = data;
		const res = await axios.post(url, d, {
			headers: opts.headers as any
		});

		// fetch text then parse as json, so that when errors occur we can output what it was
		// rather than being stuck with errors like these:
		// FetchError: invalid json response body at https://discuss.bevry.me/posts/507.json reason: Unexpected token < in JSON at position 0
		const text = await res.data;
		// check if there are errors
		if (typeof (data as any).errors !== 'undefined') {
			// check if the error is a rate limit
			const wait: number = (data as any).extras?.wait_seconds
			if (wait != null) {
				// if it was, try later
				// return await retry(wait + 1)
			}

			// otherwise fail
			// logger.debug({ data, url, opts })
			return Promise.reject(
				new Error(
					`fetch of [${url}] received failed response:\n${data}`
				)
			)
		}
		return text;
	}



	/** Fetch a discourse API URL, with rate limit retries */
	private async _fetch<T>({ url, request }: FetchConfig): Promise<T> {

		const httpsAgent = new https.Agent({
			rejectUnauthorized: false,
		});
		const opts = {
			...request,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'Api-Key': this.key,
				'Api-Username': this.username,
				...request?.headers
			},
			rejectUnauthorized: false,
			agent: httpsAgent
		}

		const retry = (seconds: number) => {
			return new Promise<T>((resolve, reject) => {
				setTimeout(
					() =>
						this._fetch<T>({ url, request })
							.then(resolve)
							.catch(reject),
					(seconds || 60) * 1000
				)
			})
		}

		try {
			const res = await fetch(url, opts);
			// fetch text then parse as json, so that when errors occur we can output what it was
			// rather than being stuck with errors like these:
			// FetchError: invalid json response body at https://discuss.bevry.me/posts/507.json reason: Unexpected token < in JSON at position 0
			const text = await res.text()
			let data: T

			try {
				data = JSON.parse(text) as T
			} catch (err) {
				// check if it was cloudflare reporting that the server has been hit too hard
				if (text.includes('Please try again in a few minutes')) {
					logger.debug('server has stalled, trying again in a minute')
					return await retry(60)
				}
				// otherwise log the error page and die
				// logger.debug({ text, url , opts })
				return Promise.reject(
					logger.error(text, url, opts, err) &&
					new Error(`fetch of [${url}] received invalid response:\n${text}`)
				)
			}

			// check if there are errors
			if (typeof (data as any).errors !== 'undefined') {
				// check if the error is a rate limit
				const wait: number = (data as any).extras?.wait_seconds
				if (wait != null) {
					// if it was, try later
					return await retry(wait + 1)
				}

				// otherwise fail
				// logger.debug({ data, url, opts })
				return Promise.reject(
					new Error(
						`fetch of [${url}] received failed response:\n${data}`
					)
				)
			}
			return data
		} catch (err) {
			// logger.debug({ err, url, opts })
			return Promise.reject(
				logger.error(`fetch of [${url}] failed with error`, err)
			)
		}
	}

	// =================================
	// Search

	/**
	 * API Helper for {@link .search}
	 * https://docs.discourse.org/#tag/Search/operation/search
	 */
	public async search(
		query: string,
		params: string = '',
		opts: FetchOptions = {}
	): Promise<ISearchResult> {
		let url = `${this.host}/search.json?q=${encodeURIComponent(query)} ${encodeURIComponent(params)}`;
		return await this.fetch<ISearchResult>({ url, ...opts })
	}
	// =================================
	// Tags

	/**
	 * API Helper for {@link .getTags}
	 */
	protected async getTagsResponse(
		opts: FetchOptions = {}
	): Promise<TagsResponse> {
		const url = `${this.host}/tags.json`
		return await this.fetch<TagsResponse>({ url, ...opts })
	}

	/**
	 * Fetch the whole information, for all categories of the forum
	 */
	async getTags(opts: FetchOptions = {}): Promise<Tag[]> {
		const response = await this.getTagsResponse(opts)
		const tags = response.tags
		return tags
	}

	async createTag(name): Promise<any> {
		const url = `${this.host}/tag_groups.json`
		try {
			return await this._post(url, {
				name
			});
		} catch (error) {
			debugger
		}

	}

	// =================================
	// CATEGORIES

	/**
	 * API Helper for {@link .getCategories}
	 */
	protected async getCategoriesResponse(
		opts: FetchOptions = {}
	): Promise<CategoriesResponse> {
		const url = `${this.host}/categories.json` +
			(opts.include_subcategories ? '?include_subcategories=true' : '')
		return await this.fetch<CategoriesResponse>({ url, ...opts })
	}

	/**
	 * Fetch the whole information, for all categories of the forum
	 */
	async getCategories(opts: FetchOptions = {}): Promise<Category[]> {
		const response = await this.getCategoriesResponse(opts)
		const categories = response.category_list.categories
		return categories
	}

	/**
	 * API Helper for {@link .getTopicItemsOfCategory}
	 * Discourse does not provide an API for fetching category information for a specific category.
	 * Instead, all that it provides is a way of getting the topics for a specific category.
	 */
	protected async getCategoryResponse(
		categoryID: number,
		opts: FetchOptions = {}
	): Promise<CategoryResponse> {
		const url =
			`${this.host}/c/${categoryID}.json` +
			(opts.page !== 0 ? `?page=${opts.page}` : '')
		return await this.fetch<CategoryResponse>({ url, ...opts })
	}

	// =================================
	// TOPICS

	/**
	 * Fetch the partial information, for all topics of a specific category
	 */
	async getTopicItemsOfCategory(
		categoryID: number,
		opts: FetchOptions = {}
	): Promise<TopicItem[]> {
		// prepare and fetch
		let page = opts.page || 0
		const response = await this.getCategoryResponse(categoryID, {
			...opts,
			page,
		})

		let topics: TopicItem[] = response.topic_list.topics

		// fetch the next page
		if (topics.length === response.topic_list.per_page) {
			page += 1
			const more = await this.getTopicItemsOfCategory(categoryID, {
				...opts,
				page,
			})
			topics.push(...more)
		}

		// if we are the first page, then output count as we now have all of them
		if (page === 0) {
			const ids = topics.map((i: TopicItem) => i.id)
		}

		topics = topics.filter((t) => t.visible === true);

		return topics
	}

	/**
	 * Fetch the partial information, for all topics of specific categoires
	 */
	async getTopicItemsOfCategories(
		categoryIDs: number[],
		opts: FetchOptions = {}
	): Promise<TopicItem[]> {
		// fetch topic items for specific categories
		try {
			const topicsOfCategories = await Promise.all(
				categoryIDs.map((id) => this.getTopicItemsOfCategory(id, opts))
			)
			// @ts-ignore
			return topicsOfCategories.flat()
		} catch (error) {
			logger.error(error);
		}
	}

	/**
	 * Fetch the partial information, for all topics of the forum
	 */
	async getTopicItems(opts: FetchOptions = {}) {
		const categories = await this.getCategories()
		const categoryIDs = categories.map((i) => i.id)
		return this.getTopicItemsOfCategories(categoryIDs, opts)
	}

	/**
	 * Fetch the whole information, for a specific topic of the forum
	 */
	getTopic(id: number, opts: FetchOptions = {}): Promise<TopicResponse> {
		const url = `${this.host}/t/${id}.json`
		return this.fetch<TopicResponse>({ url, ...opts })
	}

	/**
	 * Fetch the whole information, for all topics, or specific topics, of the forum
	 */
	async getTopics(
		topicIDs?: number[] | null,
		opts: FetchOptions = {}
	): Promise<TopicItem[] | TopicResponse[]> {
		// if no topics, use all topics
		if (!topicIDs) {
			const topics = await this.getTopicItems(opts)
			topicIDs = topics.map((i) => i.id)
		}

		// fetch whole topics
		return Promise.all(topicIDs.map((id) => this.getTopic(id, opts)))
	}

	async updateTopicVisibility(
		topicID: number,
		listed: boolean = true,
		visible: TPostStatus = 'visible'
	): Promise<TPostStatusUpdate> {
		const url = `${this.host}/t/${topicID}/status`
		let ret = await fetch(url, {
			"headers": {
				"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
				'Api-Key': this.key,
				'Api-Username': this.username
			},
			"body": `status=${visible}&enabled=${listed}`,
			"method": "PUT"
		});

		return ret
	}

	async updateTopicTimestamp(
		topicID: number,
		timestamp: Date | string | number,
		token: string
	): Promise<any> {
		let time: number
		if (typeof timestamp === 'number') {
			time = timestamp
		} else if (typeof timestamp === 'number') {
			time = Number(timestamp)
		} else if (timestamp instanceof Date) {
			// ms to seconds
			time = timestamp.getTime() / 1000
		} else {
			return Promise.reject(new Error('invalid timestamp format'))
		}

		const url = `${this.host}/t/${topicID}/change-timestamp`


		// prepare the request
		const request: TopicUpdateTimestampRequest = {
			timestamp: time,
		}

		// send the update
		logger.debug('updating', topicID, 'topic timestamp with', request)
		//const url = `${this.host}/t/${topicID}/change-timestamp`
		const response = await this.fetch<TopicUpdateTimestampResponse>({
			url,
			request: {
				method: 'put',
				body: `timestamp=${time}`,
				headers: {
					'Api-Key': this.key,
					'Api-Username': this.username,
					"content-type": "application/x-www-form-urlencoded; charset=UTF-8"

				}
			}
		})

		// check it
		if (response.success !== 'OK') {
			return Promise.reject(
				new Error(
					`timestamp update of topic ${topicID} failed:\n${{
						url,
						request,
						response,
					}}`
				)
			)
		}

		return response
	}

	// =================================
	// POSTS

	/**
	 * API Helper for {@link .getPostItemsOfTopic}
	 */
	protected async getPostItemsOfTopicResponse(
		topicID: number,
		opts: FetchOptions = {}
	): Promise<PostsResponse> {
		const url = `${this.host}/t/${topicID}/posts.json`
		const response = await this.fetch<PostsResponse>({ url, ...opts })
		return response
	}

	async _createUser(name, email, pUserGroup): Promise<ICreateUserResponse> {

		const pwd = generate({
			length: 10,
			numbers: true
		})

		let user = await this.createUser({
			"name": name,
			"email": email,
			"password": pwd,
			"username": name,
			"active": true,
			"approved": true,
			"user_fields[1]": true
		}) satisfies ICreateUserResponse;

		if (user && user.user_id) {
			await this.updateGroup(name, pUserGroup);
			return { ...user, password: pwd };
		} else {
			if (user && user.message && user.message == 'Username must be unique\nPrimary email has already been taken') {
				return null;
			} else if (user && user.message && user.message == 'Your account is activated and ready to use.') {
				if (user.user_id) {
					return { ...user, password: pwd };
				}
				return null;
			} else {
				console.log('cant create user ' + name, user);
			}
			return null;
		}
	}

	async getUsers(page): Promise<IDiscourseUser> {
		const url = `${this.host}/admin/users/list/active.json?page=` + page
		const response = await this.fetch<IDiscourseUser>({ url })
		return response
	}

	async getUser(id): Promise<IUserDetail> {
		const url = `${this.host}/admin/users/${id}.json`
		const response = await this.fetch<IUserDetail>({ url })
		return response;
	}

	/**
	 * Fetch the partial information, for all posts of a specific topic
	 */
	async getPostItemsOfTopic(
		topicID: number,
		opts: FetchOptions = {}
	): Promise<PostItem[]> {
		const response = await this.getPostItemsOfTopicResponse(topicID, opts)
		const posts: PostItem[] = response.post_stream.posts
		const ids = posts.map((i) => i.id)
		return posts
	}

	/**
	 * Fetch the partial information, for all posts of specific topics
	 */
	async getPostItemsOfTopics(
		topicIDs: number[],
		opts: FetchOptions = {}
	): Promise<PostItem[]> {
		// fetch post items for specific topics
		const postItemsOfTopics = await Promise.all(
			topicIDs.map((id) => this.getPostItemsOfTopic(id, opts))
		)

		// @ts-ignore
		return postItemsOfTopics.flat()
	}

	/**
	 * Fetch the partial information, for all posts of a specific category
	 */
	async getPostItemsOfCategory(
		categoryID: number,
		opts: FetchOptions = {}
	): Promise<PostItem[]> {
		// fetch topics for the category
		const topics = await this.getTopicItemsOfCategory(categoryID, opts)
		const topicIDs = topics.map((i) => i.id)

		// fetch
		const posts = await this.getPostItemsOfTopics(topicIDs)
		const ids = posts.map((i) => i.id)
		return posts
	}

	/**
	 * Fetch the partial information, for all posts of specific categories
	 */
	async getPostItemsOfCategories(
		categoryIDs: number[],
		opts: FetchOptions = {}
	): Promise<PostItem[]> {
		// fetch post items for specific categories
		const postItemsOfCategories = await Promise.all(
			categoryIDs.map((id) => this.getPostItemsOfCategory(id, opts))
		)

		// @ts-ignore
		return postItemsOfCategories.flat()
	}

	/**
	 * Fetch the partial information, for all posts of the forum
	 */
	async getPostItems(opts: FetchOptions = {}): Promise<PostItem[]> {
		const categories = await this.getCategories()
		const categoryIDs = categories.map((i) => i.id)
		return this.getPostItemsOfCategories(categoryIDs, opts)
	}

	/**
	 * Fetch the whole information, for a specific post of the forum
	 */
	getPost(id: number, opts: FetchOptions = {}): Promise<PostResponse> {
		const url = `${this.host}/posts/${id}.json`
		return this.fetch<PostResponse>({ url, ...opts })
	}

	async createReply(postId, raw, category) {

		const url = `${this.host}/posts.json`;

		const data = new URLSearchParams()
		data.append('raw', raw)
		data.append('unlist_topic', 'false')
		data.append('category', String(category))
		data.append('topic_id', String(postId))
		data.append('is_warning', 'false')
		data.append('archetype', 'regular')
		data.append('featured_link', '')
		data.append('shared_draft', 'false')
		data.append('nested_post', 'true')

		return await axios.post(url, data.toString(), {
			headers: {
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		});

	}

	async changeOwner(postId: string | number, topicId: string | number, owner: string
	) {
		const url = `${this.host}/t/${topicId}/change-owner.json`;

		const body = `post_ids%5B%5D=${postId}&username=${owner}`;

		return await axios.post(url, body, {
			headers: {
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		})
	}

	async createUser(data): Promise<ICreateUserResponse> {
		const url = `${this.host}/users`
		return await this._post(url, data);
	}

	async getUserByUsername(username): Promise<IUserDetail> {
		const url = `${this.host}/u/${username}.json`
		const response = await this.fetch<IUserDetail>({ url })
		return (response as any).user
	}

	async setUserAvatar(user_name, upload_id): Promise<PostResponse[]> {
		// fetch whole posts
		const url = `${this.host}/u/${user_name}/preferences/avatar/pick.json`;
		return await axios.put(url, {
			upload_id,
			username: user_name,
			type: 'uploaded'
		}, {
			headers: {
				'accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.8',
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		});
	}

	async updateUser(user_name, args): Promise<PostResponse[]> {

		const url = `${this.host}/u/${user_name}.json`;
		return await axios.put(url, {
			...args
		}, {
			headers: {
				'accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.8',
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		});
	}

	async updateGroup(user_name, group) {
		// fetch whole posts
		const url = `${this.host}/groups/${group}/members.json`;
		const t = axios.put(url, {
			usernames: user_name,
			notify_users: false
		}, {
			headers: {
				'accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.8',
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		});
		t.then((d) => {

		}).catch((e) => {
			//debugger;
		})
		return t;
	}



	async upload(userId, file): Promise<any[]> {
		// fetch whole posts
		const url = `${this.host}/uploads.json`;

		let data: any = new FormData();
		const fsData = path.parse(file);
		data.append('file', file, fsData.base);
		data.append('user_id', userId);
		data.append('upload_type', 'avatar');
		data.append('file', fs.createReadStream(file));

		return (await axios.post(url, data, {
			headers: {
				'accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.8',
				'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		})).data;
	}

	async uploadFile(userId, file): Promise<PostResponse[]> {
		// fetch whole posts
		const url = `${this.host}/uploads.json`;
		let data: any = new FormData();
		const fsData = path.parse(file);
		data.append('file', file, fsData.base);
		data.append('user_id', userId);
		data.append('upload_type', 'composer');
		data.append('file', fs.createReadStream(file));

		return (await axios.post(url, data, {
			headers: {
				'accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.8',
				'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		})).data;
	}

	// =================================
	// POSTS: UPDATING

	/**
	 * Fetch the whole information, for all posts, or specific posts, of the forum
	 */
	async getPosts(
		postIDs?: number[] | null,
		opts: FetchOptions = {}
	): Promise<PostResponse[]> {
		// if no posts, use all
		if (!postIDs) {
			const posts = await this.getPostItems(opts)
			postIDs = posts.map((i) => i.id)
		}

		// fetch whole posts
		return await Promise.all(postIDs.map((id) => this.getPost(id, opts)))
	}

	async createPost(
		title: string,
		raw: string,
		category: number
	) {
		// fetch whole posts
		const url = `${this.host}/posts`
		return new Promise((resolve) => {
			return this._post(url, { raw, title, category }).then((d) => {
				resolve(d);
			}).catch((e) => {
				resolve(e.response.data);
			})
		});
	}

	/**
	 * Update a post with the content
	 * @param postID the identifier of the post to update
	 * @param content the new raw content for the post
	 * @param reason the reason, if provided, for modifying the post
	 * @param old if the old raw content is provided, then the update verified that you are working with the latest post content before applying the update
	 */
	async updatePost(
		postID: number,
		content: string,
		reason: string = 'api update',
		old?: string
	): Promise<PostUpdateItem> {
		// prepare the request
		const data: PostUpdateRequest = {
			post: {
				raw: content,
				edit_reason: reason,
			},
		}
		if (old) {
			data.post.raw_old = old
		}

		// send the update
		const url = `${this.host}/posts/${postID}.json`
		const response = await this.fetch<PostUpdateResponse>({
			url,
			request: {
				method: 'put',
				body: JSON.stringify(data),
			},
		})

		// return the response
		return response.post
	}

	/**
	 * Update post meta
	 */
	async updateTopic(
		postId: number,
		category_id: number,
		title: string,
		tags?: string[]
	): Promise<TopicUpdateBasicTopic> {
		const data =
		{
			title,
			tags: tags || [],
			featuredLink: null,
			category_id
		}

		const url = `${this.host}/t/${postId}.json`
		const response = await this.fetch<any>({
			url,
			request: {
				method: 'put',
				body: JSON.stringify(data),
			},
		})
		return response.basic_topic
	}



	async rebakePost(postID: number): Promise<any> {

		const url = `${this.host}/posts/${postID}/rebake`
		logger.debug('rebaking', postID)

		const response = await this.fetch<PostResponse>({
			url,
			request: {
				method: 'put'
			}
		})
		logger.debug('rebaked', postID)
		return response
	}



	/**
	 * Modify a post using a modifier
	 */
	async modifyPost(
		post: PostResponse,
		modifier: PostModifier
	): Promise<PostUpdateItem | null> {
		// check if we received a post item, instead of a post response
		if (post.raw == null) {
			post = await this.getPost(post.id)
		}

		// check
		if (!post.raw) {
			return Promise.resolve(null)
		}

		// replace
		const { result, reason } = modifier(post)
		if (result === post.raw) {
			// if (post.cooked) {
			// 	const { result, reason } = modifier(post.cooked)
			// 	if (result !== post.cooked) {
			// 		logger.debug(
			// 			'replace did have an effect on cooked post',
			// 			postID,
			// 			'so rebaking it'
			// 		)
			// 		return await this.rebakePost(postID)
			// 	}
			// }
			return Promise.resolve(null)
		}

		// dry
		if (this.dry) {
			return Promise.resolve({
				...((post as unknown) as PostUpdateItem),
				result,
				reason,
			})
		}

		// update
		try {
			return await this.updatePost(post.id, result, reason, post.raw)
		} catch (err) {
			if (
				err.message.includes(
					'That post was edited by another user and your changes can no longer be saved.'
				)
			) {
				return this.modifyPost(
					await this.getPost(post.id, { useCache: false }),
					modifier
				)
			}
			logger.error(err);
			return Promise.reject(`modifying post ${post.id} failed`)
		}
	}

	/**
	 * Modify a post (via its post identifier) using a modifier
	 */
	async modifyPostID(post: number, modifier: PostModifier) {
		return this.modifyPost(await this.getPost(post), modifier)
	}

	/**
	 * Modify a post (via fetching the whole post from the partial post identifier) using a modifier
	 */
	async modifyPostItem(post: PostItem, modifier: PostModifier) {
		return this.modifyPost(await this.getPost(post.id), modifier)
	}

	/**
	 * Run the post modifier on all specified posts
	 */
	async modifyPosts(
		posts: PostResponse[],
		modifier: PostModifier
	): Promise<PostUpdateItem[]> {
		const updates = await Promise.all(
			posts.map((post) => this.modifyPost(post, modifier))
		)
		const updated = updates.filter((i) => i) as PostUpdateItem[]
		return updated
	}

	// =================================
	// THREADS

	/**
	 * Fetch the partial information, for all posts of a specific topic
	 * Alias of {@link .getPostItemsOfTopic}.
	 */
	async getThread(topicID: number, opts: FetchOptions = {}): Promise<Thread> {
		const topic = await this.getTopic(topicID, opts)
		const [post, ...replies] = await this.getPostItemsOfTopic(topicID, opts)
		return {
			topic,
			post,
			replies,
		}
	}

	/**
	 * Fetch the partial information, for all posts of specific topics, grouped by topic
	 */
	async getThreads(
		topicIDs: number[],
		opts: FetchOptions = {}
	): Promise<Thread[]> {
		return await Promise.all(topicIDs.map((id) => this.getThread(id, opts)))
	}

	/**
	 * Fetch the partial information, for all posts of specific categories, grouped by topic
	 */
	async getThreadsOfCategory(
		categoryID: number,
		opts: FetchOptions = {}
	): Promise<Thread[]> {
		// fetch topics for the category
		const topics = await this.getTopicItemsOfCategory(categoryID, opts)
		const topicIDs = topics.map((i) => i.id)
		// return threads
		return await this.getThreads(topicIDs)
	}

	/**
	 * Fetch the partial information, for all posts of specific categories, grouped by category, then topic
	 */
	async getThreadsOfCategories(
		categoryIDs: number[],
		opts: FetchOptions = {}
	): Promise<Thread[][]> {
		return await Promise.all(
			categoryIDs.map((id) => this.getThreadsOfCategory(id, opts))
		)
	}

	async updateUserProfile(userId, prefs: UserPreferencesUpdate): Promise<any> {

		const url = `${this.host}/u/${userId}.json`
		let data: any = new FormData()

		data.append('bio_raw', prefs.bio_raw)

		prefs.location && data.append('location', prefs.location)
		prefs.website && data.append('website', prefs.website)

		return await axios.put(url, data, {
			headers: {
				'accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.8',
				"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		})
	}

}


export const Instance = (config?: IDiscourseConfig, key: EDiscourseConfigKey = 'discourse_admin') => {

	return new Discourser(config || (CONFIG_DEFAULT() as IOSRConfig)[key])

	/*

	d.getTopicItemsOfCategories([cat]).then(posts => {
		//console.log('posts', posts)
		let content = "<ul>"
		posts = posts.map((p) => {
			const url = `${config.discourse.host}/t/${p.id}`;
			const title = `${p.fancy_title}`;
			return `<li><a href="${url}">${title}</a></li>`;
		}).join('\n');
		content += posts + "</ul>";
		resolve(content);

	});
	*/
}