import { MODULE_NAME } from '../../constants'

import { CONFIG_DEFAULT } from '@polymech/commons'

import { IOSRConfig, IDiscourseConfig } from '@polymech/commons/types'

import { logger as _logger } from '@polymech/core/debug'

export const logger: any = _logger(MODULE_NAME)

import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/write'
import { sync as exists } from '@polymech/fs/exists'

import PromisePool from 'native-promise-pool'


import { join } from 'path'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as FormData from 'form-data'

const https = require('https')
const request = require("request")
const fetch = require('isomorphic-unfetch')

export const escape = (path: string) =>
	path.replace(/[^\w]/g, '-').replace(/-+/, '-')

import { generate } from 'generate-password'

import { TPostStatus, TPostStatusUpdate, UserPreferencesUpdate } from './types'

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
} from './types';
import { IDiscourseUser } from '@polymech/commons'
import { EDiscourseConfigKey } from './constants'
import { IDImage } from '../oa/index'



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
		const opts: RequestInit = {
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

		let ret = await fetch(url, {
			"headers": {

				"accept-language": "en-GB,en-US;q=0.9,en;q=0.8,de;q=0.7,es;q=0.6,fr;q=0.5",
				"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
				"x-csrf-token": token,
				"x-requested-with": "XMLHttpRequest",
				"cookie": "_bypass_cache=true; _ga_MBZGKNMDWC=GS1.1.1685892974.20.1.1685893082.0.0.0; _ga_P4SR15V1XR=GS1.1.1687459978.51.1.1687460537.0.0.0; _ga_H8W78Y3P2B=GS1.1.1687604701.23.0.1687604701.0.0.0; _ga=GA1.1.401826746.1678337758; _t=xQ05qW5JFxLM9Pq0lIwG6ez74Z1q2OLpak0DzRx8VdFYE5eI3oJXhLURPrdm2zIcHmYcBj9q%2BKdHhGz5N6j9mXitYzcMwkXHL3K9GYKdO4gJ8tBQimpmd1HFaRhB9Ml9aJ8WviqQWDZDOYwEUKFcWw3wbAalfQtbdIbUSX8gH9sG6DLFU3HiEg7tWModRy%2BoFrTm6QOalDuajRW3nBazau%2FiY8ZCVm2g30Y10CBDfqJHL1ztV8XM4kEIeulLNTzGVtSb7uuO1OcjZRSb--aDgCPEalq7SIpnH5--HWCNf5readaeij3oDl9b9w%3D%3D; __profilin=p%3Dt%2Ca%3Deef38e031f99cc8240f3518e1b8811cf; _forum_session=RkEWuzKI1QXBYCnP6KRamD8mweZ3h9%2B6G%2Fi23gAWUgy8gp8FuiyQD5lKU0Fbx3FzzaM4SiQcvnIiEAnb5P4OYjlvstqwWlfRp%2B9is7iX8StwYGiYsncHQ5LrzSbV3y9mR7sj%2F8JZ8evQOe2ZZjZB3iEkppsGrmyFrw5PsUgSphRTZm70SKIw96JrW17yK4hhLqtk%2BaQPgNu4oJl42YfXAr%2FCBldcBUKXFeHppYmv61WECV0531hCo7GcA4t06B9QpSr%2BeoiM1Ok9tpQrAlZf36Ka4lVCTyXXu3SNvbtvfd9tZMJCWDYv69jdMsezuOaEP870pk9qYPaL4x6nAY5EXO3u9usCggqQ1B1EydCK9uMy7ZUCIo9wONw7QOIgEQ%3D%3D--GMqYSb2H7xXVDky6--R9gVciBqwC0IL9LefywrFw%3D%3D; _ga_GVR8PEPG6C=GS1.1.1687710574.106.1.1687710599.0.0.0",
				'Api-Key': this.key,
				'Api-Username': this.username
			},
			"body": `timestamp=${time}`,
			"method": "PUT"
		});

		if (ret && ret.status === 200) {
			return true
		}
		return

		/*
		let data = new FormData();
		data.append('timestamp', time);

		try {
			let ret = await axios.put(url, data, {
				headers: {
					//'Accept-Language': 'en-US,en;q=0.8',
					//'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
					//'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
					'Api-Key': this.key,
					'Api-Username': this.username
				}
			});
			debugger
		} catch (error) {
			debugger
		}


		return
		*/

		/*
		var options = {
			method: 'PUT',
			url: url,
			headers:
			{
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Api-Key': this.key,
				'Api-Username': this.username
			},
			body: `timestamp=${time}`
		};

		new Promise((resolve, reject) => {
			request(options, function (error, response, body) {
				if (error) {
					throw new Error(error);
				} else {
					resolve(body);
				}
			});
		});
		*/

		/*
		var options = {
			method: 'POST',
			url: url,
			headers:
			{
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Api-Key': this.key,
				'Api-Username': this.username
			},
			body
		}


		return new Promise((resolve, reject) => {
			request(options, function (error, response, body) {
				if (error) {
					throw new Error(error);
				} else {
					resolve(body);
				}
			});
		});
*/


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

		let data: any = new FormData();
		data.append('topic_id', '' + postId);
		data.append('raw', raw);
		data.append('nested_post', 'true');
		data.append('category', category);
		var options = {
			method: 'POST',
			url: url,
			headers:
			{
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Api-Key': this.key,
				'Api-Username': this.username
			},
			"body": `raw=${raw}&unlist_topic=false&category=${category}&topic_id=${postId}&is_warning=false&archetype=regular&featured_link=&shared_draft=false&nested_post=true`,
		};

		return new Promise((resolve, reject) => {
			request(options, function (error, response, body) {
				if (error) {
					throw new Error(error);
				} else {
					resolve(body);
				}
			});
		});

	}

	async changeOwner(postId: string | number, topicId: string | number, owner: string
	) {
		const url = `${this.host}/t/${topicId}/change-owner.json`;
		var options = {
			method: 'POST',
			url: url,
			headers:
			{
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Api-Key': this.key,
				'Api-Username': this.username
			},
			body: `post_ids%5B%5D=${postId}&username=${owner}`
		};


		return new Promise((resolve, reject) => {
			request(options, function (error, response, body) {
				if (error) {
					throw new Error(error);
				} else {
					resolve(body);
				}
			});
		});
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



	async upload(userId, file): Promise<IDImage[]> {
		// fetch whole posts
		const url = `${this.host}/uploads.json`;

		let data: any = new FormData();
		const fsData = path.parse(file);
		data.append('file', file, fsData.base);
		data.append('user_id', userId);
		data.append('upload_type', 'avatar');
		data.append('file', fs.createReadStream(file));

		return await axios.post(url, data, {
			headers: {
				'accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.8',
				'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		});
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

		return await axios.post(url, data, {
			headers: {
				'accept': 'application/json',
				'Accept-Language': 'en-US,en;q=0.8',
				'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
				'Api-Key': this.key,
				'Api-Username': this.username
			}
		});
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

	/*
	{
		"bio_raw": "about me\n\ntest",
		"website": "https://shop.osr-plastic.org",
		"location": "Barcelona",
		"custom_fields": {
			"geo_location": {
				"lat": "9.4170689",
				"lon": "123.3351935",
				"address": "Santander, Cebu, Central Visayas, 6026, Philippines",
				"countrycode": "ph",
				"city": "Santander",
				"state": "Cebu",
				"country": "Philippines",
				"postalcode": "6026",
				"boundingbox": [
					"9.3630227",
					"9.491731",
					"123.2684005",
					"123.3642727"
				],
				"type": "administrative"
			}
		},
		"timezone": "Europe/Berlin",
		"default_calendar": "none_selected"
	}*/
	/*
		fetch("https://forum.osr-plastic.org/u/katharinaelleke.json", {
	  "headers": {
		"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
		"discourse-logged-in": "true",
		"discourse-present": "true",
		"sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
		"sec-ch-ua-mobile": "?0",
		"sec-ch-ua-platform": "\"Windows\"",
		"x-csrf-token": "0Nau_ylBzR68D5OvfxfOHYii6GI_7gSrr_Ci_9S8ZDjqjy5mavF_O_INAPD8xfCQHgJkDH4rdgS0kPfjMAMBFw",
		"x-requested-with": "XMLHttpRequest",
		"Referer": "https://forum.osr-plastic.org/u/katharinaelleke/preferences/profile",
		"Referrer-Policy": "strict-origin-when-cross-origin"
	  },
	  "body": "bio_raw=Curious%2C+serious+and+not+so+serious+%3Aslight_smile%3A+%0A&website=https%3A%2F%2Fwww.theflipflopi.com%2F&custom_fields%5Bnotify_me_when_followed%5D=false&custom_fields%5Bnotify_followed_user_when_followed%5D=false&custom_fields%5Bnotify_me_when_followed_replies%5D=false&custom_fields%5Bnotify_me_when_followed_creates_topic%5D=false&custom_fields%5Ballow_people_to_follow_me%5D=false&custom_fields%5Bgeo_location%5D%5Blat%5D=-2.294164&custom_fields%5Bgeo_location%5D%5Blon%5D=40.91501&custom_fields%5Bgeo_location%5D%5Baddress%5D=African+Corner%2C+Lamu%2C+Coast%2C+Kenya&custom_fields%5Bgeo_location%5D%5Bcountrycode%5D=ke&custom_fields%5Bgeo_location%5D%5Bcity%5D=&custom_fields%5Bgeo_location%5D%5Bstate%5D=Coast&custom_fields%5Bgeo_location%5D%5Bcountry%5D=Kenya&custom_fields%5Bgeo_location%5D%5Bpostalcode%5D=&custom_fields%5Bgeo_location%5D%5Bboundingbox%5D%5B%5D=-2.294164&custom_fields%5Bgeo_location%5D%5Bboundingbox%5D%5B%5D=-2.294164&custom_fields%5Bgeo_location%5D%5Bboundingbox%5D%5B%5D=40.91501&custom_fields%5Bgeo_location%5D%5Bboundingbox%5D%5B%5D=40.91501&custom_fields%5Bgeo_location%5D%5Btype%5D=&user_fields%5B1%5D=https%3A%2F%2Fshop.osr-plastic.org%2Fafrica%2F&user_fields%5B2%5D=https%3A%2F%2Fwww.theflipflopi.com%2F&user_fields%5B3%5D=https%3A%2F%2Fwww.instagram.com%2Fkatatungo%2F&user_fields%5B4%5D=unknown&user_fields%5B5%5D=unknown&profile_background_upload_url=https%3A%2F%2Fforum.osr-plastic.org%2Fuploads%2Fdefault%2Foriginal%2F2X%2F0%2F0875e1aea65f41172b9c4ad60b1a372cbaa72b2b.jpeg&card_background_upload_url=https%3A%2F%2Fforum.osr-plastic.org%2Fuploads%2Fdefault%2Foriginal%2F2X%2F3%2F357088c493bd0f66e651211853fb18beee2ec2e4.jpeg&timezone=Africa%2FNairobi&default_calendar=none_selected",
	  "method": "PUT"
	});


	fetch("https://forum.osr-plastic.org/u/admin-osr.json", {
  "headers": {
	"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
	"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
	"discourse-logged-in": "true",
	"discourse-present": "true",
	"sec-ch-ua": "\"Not/A)Brand\";v=\"99\", \"Google Chrome\";v=\"115\", \"Chromium\";v=\"115\"",
	"sec-ch-ua-mobile": "?0",
	"sec-ch-ua-platform": "\"Windows\"",
	"sec-fetch-dest": "empty",
	"sec-fetch-mode": "cors",
	"sec-fetch-site": "same-origin",
	"x-csrf-token": "gjd-DOi_nULFDhLyUh4igqFZENxL6B4rufR3dfbY9H9Soc-YDwOQS1SYSwJlj6f2f7BpDf5CO9y-zyOPBj-E1Q",
	"x-requested-with": "XMLHttpRequest",
	"cookie": "_ga=GA1.1.983567986.1691921410; _t=onvQ4UWFfLfjFsFkmebQdDot6JXW8%2FAWgFEtJUZ51AqXbTKnI%2BPF80usnZkhYqyYYW9Q%2B1fuMyEy5bDXc9AJpwwkcVIg%2Fu1DTE39y3nGdpXMiiVsmkMqBkyGA%2FvpvZUrM23CDS0xT%2B09VSSlNUbu8lZY27hYWXio4ETx7DRTmBk0xY52d3R6bcmtofynfxldP5KceF0APNtl9AV6iUhWloQ32CK6PmzpSFq4E3hstsS1WPTf7SwLGvESWm4tn3M4EQ2v4RHuLiHaAj%2F0--mv8Byxo5aHGcgKPO--%2F9eiy%2B24FCNmiLF3%2FpGZag%3D%3D; _ga_GVR8PEPG6C=GS1.1.1691940751.2.1.1691940775.0.0.0; _forum_session=bLbNekWpq6fkdK%2B19Nw6ZoKeEk9Ijp8LPfmQAjBiGK0TcnIYzMhZ5LJmLrxmG39e85SgUz%2F7NMI3NXZM9j%2F35eJuO3hxnUAkFvBNwjwwS9LGhDB4kB3ebAjjcBpoLPzUMWqyslQuR9RM8JcjZ%2FfX%2FWw0E61l9jhfrG0dr8Ds97IW7XedjKCmI7x7xinv10R2bRb51%2F72t2Z4dVG86wyCAtI5Spom0yjHoWPHwWBZ7VPYtOCmSBVygusuF%2FW5hpO9wgn1oqc0ZZ%2BXj%2FPiFc0FsADEcKYh3Q%3D%3D--xdEsXmADtTKkFGSc--x%2Fd9m02lRNk0uH%2BPxZTNwQ%3D%3D",
	"Referer": "https://forum.osr-plastic.org/u/admin-osr/preferences/profile",
	"Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": "bio_raw=%23%23+Test%0A%0A%60%60%60js%0Aconst+t+%3D+0%0A%60%60%60%0A%0A%5Btest%5D(www.test.com)%0A%0A&website=www.test-site.com&location=test-loc&profile_background_upload_url=https%3A%2F%2Fforum.osr-plastic.org%2Fuploads%2Fdefault%2Foriginal%2F2X%2Fd%2Fd097423e34a6c677cdb0933d091fb84bcfbcec2e.jpeg&card_background_upload_url=https%3A%2F%2Fforum.osr-plastic.org%2Fuploads%2Fdefault%2Foriginal%2F2X%2Fb%2Fb4c30d1b981964fd6f936ebaac0f86ad4dc01209.png&timezone=Europe%2FBerlin&default_calendar=none_selected",
  "method": "PUT"
});


	*/


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