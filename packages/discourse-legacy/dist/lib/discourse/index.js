import { MODULE_NAME } from '../../constants';
import { CONFIG_DEFAULT } from '@polymech/commons';
import { logger as _logger } from '@polymech/core/debug';
export const logger = _logger(MODULE_NAME);
import { sync as write } from '@polymech/fs/write';
import { sync as read } from '@polymech/fs/write';
import { sync as exists } from '@polymech/fs/exists';
import PromisePool from 'native-promise-pool';
import { join } from 'path';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
const https = require('https');
const request = require("request");
const fetch = require('isomorphic-unfetch');
export const escape = (path) => path.replace(/[^\w]/g, '-').replace(/-+/, '-');
import { generate } from 'generate-password';
/**
 * Discourser is an API Client for the [Discourse API](https://docs.discourse.org)
 * It special features are:
 * - TypeScript Types
 * - Respecting Rate Limits
 * - Optional Heavy Caching
 * - Post Modifiers (can be used for global find and replace across all posts on the forum)
 */
export class Discourser {
    host;
    key;
    username;
    cache;
    useCache;
    dry;
    pool;
    /**
     * Construct our Discourser instance
     * See {@link IDiscourserConfig} for available configuration.
     */
    constructor(config) {
        this.host = config.host;
        this.key = config.key;
        this.username = config.username;
        this.cache = config.cache;
        this.useCache = config.useCache;
        this.dry = config.dry || false;
        this.pool = new PromisePool(config.rateLimitConcurrency || 60);
    }
    /** Get the URL of a topic */
    getTopicURL(topic) {
        if (typeof topic === 'number') {
            return `${this.host}/t/${topic}`;
        }
        return `${this.host}/t/${topic.slug}/${topic.id}`;
    }
    /** Fetch a discourse API URL, with rate limit concurrency and optional caching */
    async fetch({ url, useCache, request }) {
        // check if cache is enabled
        useCache = false;
        const cache = this.cache &&
            (request?.method || 'get') === 'get' &&
            join(this.cache, escape(url));
        // check if we should and can read from cache
        if (cache &&
            this.useCache !== false &&
            useCache !== false &&
            (exists(cache))) {
            const result = read(cache, 'json');
            return result;
        }
        // fetch
        const result = await this.pool.open(() => this._fetch({ url, request }));
        // write to cache if cache is enabled
        if (cache) {
            write(cache, result);
        }
        // return the result
        return result;
    }
    /** Fetch a discourse API URL, with rate limit retries */
    async _post(url, data) {
        const opts = {
            headers: {
                'Api-Key': this.key,
                'Api-Username': this.username,
            },
        };
        let d = data;
        const res = await axios.post(url, d, {
            headers: opts.headers
        });
        // fetch text then parse as json, so that when errors occur we can output what it was
        // rather than being stuck with errors like these:
        // FetchError: invalid json response body at https://discuss.bevry.me/posts/507.json reason: Unexpected token < in JSON at position 0
        const text = await res.data;
        // check if there are errors
        if (typeof data.errors !== 'undefined') {
            // check if the error is a rate limit
            const wait = data.extras?.wait_seconds;
            if (wait != null) {
                // if it was, try later
                // return await retry(wait + 1)
            }
            // otherwise fail
            // logger.debug({ data, url, opts })
            return Promise.reject(new Error(`fetch of [${url}] received failed response:\n${data}`));
        }
        return text;
    }
    /** Fetch a discourse API URL, with rate limit retries */
    async _fetch({ url, request }) {
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
        };
        const retry = (seconds) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => this._fetch({ url, request })
                    .then(resolve)
                    .catch(reject), (seconds || 60) * 1000);
            });
        };
        try {
            const res = await fetch(url, opts);
            // fetch text then parse as json, so that when errors occur we can output what it was
            // rather than being stuck with errors like these:
            // FetchError: invalid json response body at https://discuss.bevry.me/posts/507.json reason: Unexpected token < in JSON at position 0
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            }
            catch (err) {
                // check if it was cloudflare reporting that the server has been hit too hard
                if (text.includes('Please try again in a few minutes')) {
                    logger.debug('server has stalled, trying again in a minute');
                    return await retry(60);
                }
                // otherwise log the error page and die
                // logger.debug({ text, url , opts })
                return Promise.reject(logger.error(text, url, opts, err) &&
                    new Error(`fetch of [${url}] received invalid response:\n${text}`));
            }
            // check if there are errors
            if (typeof data.errors !== 'undefined') {
                // check if the error is a rate limit
                const wait = data.extras?.wait_seconds;
                if (wait != null) {
                    // if it was, try later
                    return await retry(wait + 1);
                }
                // otherwise fail
                // logger.debug({ data, url, opts })
                return Promise.reject(new Error(`fetch of [${url}] received failed response:\n${data}`));
            }
            return data;
        }
        catch (err) {
            // logger.debug({ err, url, opts })
            return Promise.reject(logger.error(`fetch of [${url}] failed with error`, err));
        }
    }
    // =================================
    // Search
    /**
     * API Helper for {@link .search}
     * https://docs.discourse.org/#tag/Search/operation/search
     */
    async search(query, params = '', opts = {}) {
        let url = `${this.host}/search.json?q=${encodeURIComponent(query)} ${encodeURIComponent(params)}`;
        return await this.fetch({ url, ...opts });
    }
    // =================================
    // Tags
    /**
     * API Helper for {@link .getTags}
     */
    async getTagsResponse(opts = {}) {
        const url = `${this.host}/tags.json`;
        return await this.fetch({ url, ...opts });
    }
    /**
     * Fetch the whole information, for all categories of the forum
     */
    async getTags(opts = {}) {
        const response = await this.getTagsResponse(opts);
        const tags = response.tags;
        return tags;
    }
    async createTag(name) {
        const url = `${this.host}/tag_groups.json`;
        try {
            return await this._post(url, {
                name
            });
        }
        catch (error) {
            debugger;
        }
    }
    // =================================
    // CATEGORIES
    /**
     * API Helper for {@link .getCategories}
     */
    async getCategoriesResponse(opts = {}) {
        const url = `${this.host}/categories.json` +
            (opts.include_subcategories ? '?include_subcategories=true' : '');
        return await this.fetch({ url, ...opts });
    }
    /**
     * Fetch the whole information, for all categories of the forum
     */
    async getCategories(opts = {}) {
        const response = await this.getCategoriesResponse(opts);
        const categories = response.category_list.categories;
        return categories;
    }
    /**
     * API Helper for {@link .getTopicItemsOfCategory}
     * Discourse does not provide an API for fetching category information for a specific category.
     * Instead, all that it provides is a way of getting the topics for a specific category.
     */
    async getCategoryResponse(categoryID, opts = {}) {
        const url = `${this.host}/c/${categoryID}.json` +
            (opts.page !== 0 ? `?page=${opts.page}` : '');
        return await this.fetch({ url, ...opts });
    }
    // =================================
    // TOPICS
    /**
     * Fetch the partial information, for all topics of a specific category
     */
    async getTopicItemsOfCategory(categoryID, opts = {}) {
        // prepare and fetch
        let page = opts.page || 0;
        const response = await this.getCategoryResponse(categoryID, {
            ...opts,
            page,
        });
        let topics = response.topic_list.topics;
        // fetch the next page
        if (topics.length === response.topic_list.per_page) {
            page += 1;
            const more = await this.getTopicItemsOfCategory(categoryID, {
                ...opts,
                page,
            });
            topics.push(...more);
        }
        // if we are the first page, then output count as we now have all of them
        if (page === 0) {
            const ids = topics.map((i) => i.id);
        }
        topics = topics.filter((t) => t.visible === true);
        return topics;
    }
    /**
     * Fetch the partial information, for all topics of specific categoires
     */
    async getTopicItemsOfCategories(categoryIDs, opts = {}) {
        // fetch topic items for specific categories
        try {
            const topicsOfCategories = await Promise.all(categoryIDs.map((id) => this.getTopicItemsOfCategory(id, opts)));
            // @ts-ignore
            return topicsOfCategories.flat();
        }
        catch (error) {
            logger.error(error);
        }
    }
    /**
     * Fetch the partial information, for all topics of the forum
     */
    async getTopicItems(opts = {}) {
        const categories = await this.getCategories();
        const categoryIDs = categories.map((i) => i.id);
        return this.getTopicItemsOfCategories(categoryIDs, opts);
    }
    /**
     * Fetch the whole information, for a specific topic of the forum
     */
    getTopic(id, opts = {}) {
        const url = `${this.host}/t/${id}.json`;
        return this.fetch({ url, ...opts });
    }
    /**
     * Fetch the whole information, for all topics, or specific topics, of the forum
     */
    async getTopics(topicIDs, opts = {}) {
        // if no topics, use all topics
        if (!topicIDs) {
            const topics = await this.getTopicItems(opts);
            topicIDs = topics.map((i) => i.id);
        }
        // fetch whole topics
        return Promise.all(topicIDs.map((id) => this.getTopic(id, opts)));
    }
    async updateTopicVisibility(topicID, listed = true, visible = 'visible') {
        const url = `${this.host}/t/${topicID}/status`;
        let ret = await fetch(url, {
            "headers": {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                'Api-Key': this.key,
                'Api-Username': this.username
            },
            "body": `status=${visible}&enabled=${listed}`,
            "method": "PUT"
        });
        return ret;
    }
    async updateTopicTimestamp(topicID, timestamp, token) {
        let time;
        if (typeof timestamp === 'number') {
            time = timestamp;
        }
        else if (typeof timestamp === 'number') {
            time = Number(timestamp);
        }
        else if (timestamp instanceof Date) {
            // ms to seconds
            time = timestamp.getTime() / 1000;
        }
        else {
            return Promise.reject(new Error('invalid timestamp format'));
        }
        const url = `${this.host}/t/${topicID}/change-timestamp`;
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
            return true;
        }
        return;
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
        const request = {
            timestamp: time,
        };
        // send the update
        logger.debug('updating', topicID, 'topic timestamp with', request);
        //const url = `${this.host}/t/${topicID}/change-timestamp`
        const response = await this.fetch({
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
        });
        // check it
        if (response.success !== 'OK') {
            return Promise.reject(new Error(`timestamp update of topic ${topicID} failed:\n${{
                url,
                request,
                response,
            }}`));
        }
        return response;
    }
    // =================================
    // POSTS
    /**
     * API Helper for {@link .getPostItemsOfTopic}
     */
    async getPostItemsOfTopicResponse(topicID, opts = {}) {
        const url = `${this.host}/t/${topicID}/posts.json`;
        const response = await this.fetch({ url, ...opts });
        return response;
    }
    async _createUser(name, email, pUserGroup) {
        const pwd = generate({
            length: 10,
            numbers: true
        });
        let user = await this.createUser({
            "name": name,
            "email": email,
            "password": pwd,
            "username": name,
            "active": true,
            "approved": true,
            "user_fields[1]": true
        });
        if (user && user.user_id) {
            await this.updateGroup(name, pUserGroup);
            return { ...user, password: pwd };
        }
        else {
            if (user && user.message && user.message == 'Username must be unique\nPrimary email has already been taken') {
                return null;
            }
            else if (user && user.message && user.message == 'Your account is activated and ready to use.') {
                if (user.user_id) {
                    return { ...user, password: pwd };
                }
                return null;
            }
            else {
                console.log('cant create user ' + name, user);
            }
            return null;
        }
    }
    async getUsers(page) {
        const url = `${this.host}/admin/users/list/active.json?page=` + page;
        const response = await this.fetch({ url });
        return response;
    }
    async getUser(id) {
        const url = `${this.host}/admin/users/${id}.json`;
        const response = await this.fetch({ url });
        return response;
    }
    /**
     * Fetch the partial information, for all posts of a specific topic
     */
    async getPostItemsOfTopic(topicID, opts = {}) {
        const response = await this.getPostItemsOfTopicResponse(topicID, opts);
        const posts = response.post_stream.posts;
        const ids = posts.map((i) => i.id);
        return posts;
    }
    /**
     * Fetch the partial information, for all posts of specific topics
     */
    async getPostItemsOfTopics(topicIDs, opts = {}) {
        // fetch post items for specific topics
        const postItemsOfTopics = await Promise.all(topicIDs.map((id) => this.getPostItemsOfTopic(id, opts)));
        // @ts-ignore
        return postItemsOfTopics.flat();
    }
    /**
     * Fetch the partial information, for all posts of a specific category
     */
    async getPostItemsOfCategory(categoryID, opts = {}) {
        // fetch topics for the category
        const topics = await this.getTopicItemsOfCategory(categoryID, opts);
        const topicIDs = topics.map((i) => i.id);
        // fetch
        const posts = await this.getPostItemsOfTopics(topicIDs);
        const ids = posts.map((i) => i.id);
        return posts;
    }
    /**
     * Fetch the partial information, for all posts of specific categories
     */
    async getPostItemsOfCategories(categoryIDs, opts = {}) {
        // fetch post items for specific categories
        const postItemsOfCategories = await Promise.all(categoryIDs.map((id) => this.getPostItemsOfCategory(id, opts)));
        // @ts-ignore
        return postItemsOfCategories.flat();
    }
    /**
     * Fetch the partial information, for all posts of the forum
     */
    async getPostItems(opts = {}) {
        const categories = await this.getCategories();
        const categoryIDs = categories.map((i) => i.id);
        return this.getPostItemsOfCategories(categoryIDs, opts);
    }
    /**
     * Fetch the whole information, for a specific post of the forum
     */
    getPost(id, opts = {}) {
        const url = `${this.host}/posts/${id}.json`;
        return this.fetch({ url, ...opts });
    }
    async createReply(postId, raw, category) {
        const url = `${this.host}/posts.json`;
        let data = new FormData();
        data.append('topic_id', '' + postId);
        data.append('raw', raw);
        data.append('nested_post', 'true');
        data.append('category', category);
        var options = {
            method: 'POST',
            url: url,
            headers: {
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
                }
                else {
                    resolve(body);
                }
            });
        });
    }
    async changeOwner(postId, topicId, owner) {
        const url = `${this.host}/t/${topicId}/change-owner.json`;
        var options = {
            method: 'POST',
            url: url,
            headers: {
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
                }
                else {
                    resolve(body);
                }
            });
        });
    }
    async createUser(data) {
        const url = `${this.host}/users`;
        return await this._post(url, data);
    }
    async getUserByUsername(username) {
        const url = `${this.host}/u/${username}.json`;
        const response = await this.fetch({ url });
        return response.user;
    }
    async setUserAvatar(user_name, upload_id) {
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
    async updateUser(user_name, args) {
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
        });
        return t;
    }
    async upload(userId, file) {
        // fetch whole posts
        const url = `${this.host}/uploads.json`;
        let data = new FormData();
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
    async uploadFile(userId, file) {
        // fetch whole posts
        const url = `${this.host}/uploads.json`;
        let data = new FormData();
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
    async getPosts(postIDs, opts = {}) {
        // if no posts, use all
        if (!postIDs) {
            const posts = await this.getPostItems(opts);
            postIDs = posts.map((i) => i.id);
        }
        // fetch whole posts
        return await Promise.all(postIDs.map((id) => this.getPost(id, opts)));
    }
    async createPost(title, raw, category) {
        // fetch whole posts
        const url = `${this.host}/posts`;
        return new Promise((resolve) => {
            return this._post(url, { raw, title, category }).then((d) => {
                resolve(d);
            }).catch((e) => {
                resolve(e.response.data);
            });
        });
    }
    /**
     * Update a post with the content
     * @param postID the identifier of the post to update
     * @param content the new raw content for the post
     * @param reason the reason, if provided, for modifying the post
     * @param old if the old raw content is provided, then the update verified that you are working with the latest post content before applying the update
     */
    async updatePost(postID, content, reason = 'api update', old) {
        // prepare the request
        const data = {
            post: {
                raw: content,
                edit_reason: reason,
            },
        };
        if (old) {
            data.post.raw_old = old;
        }
        // send the update
        const url = `${this.host}/posts/${postID}.json`;
        const response = await this.fetch({
            url,
            request: {
                method: 'put',
                body: JSON.stringify(data),
            },
        });
        // return the response
        return response.post;
    }
    /**
     * Update post meta
     */
    async updateTopic(postId, category_id, title, tags) {
        const data = {
            title,
            tags: tags || [],
            featuredLink: null,
            category_id
        };
        const url = `${this.host}/t/${postId}.json`;
        const response = await this.fetch({
            url,
            request: {
                method: 'put',
                body: JSON.stringify(data),
            },
        });
        return response.basic_topic;
    }
    async rebakePost(postID) {
        const url = `${this.host}/posts/${postID}/rebake`;
        logger.debug('rebaking', postID);
        const response = await this.fetch({
            url,
            request: {
                method: 'put'
            }
        });
        logger.debug('rebaked', postID);
        return response;
    }
    /**
     * Modify a post using a modifier
     */
    async modifyPost(post, modifier) {
        // check if we received a post item, instead of a post response
        if (post.raw == null) {
            post = await this.getPost(post.id);
        }
        // check
        if (!post.raw) {
            return Promise.resolve(null);
        }
        // replace
        const { result, reason } = modifier(post);
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
            return Promise.resolve(null);
        }
        // dry
        if (this.dry) {
            return Promise.resolve({
                ...post,
                result,
                reason,
            });
        }
        // update
        try {
            return await this.updatePost(post.id, result, reason, post.raw);
        }
        catch (err) {
            if (err.message.includes('That post was edited by another user and your changes can no longer be saved.')) {
                return this.modifyPost(await this.getPost(post.id, { useCache: false }), modifier);
            }
            logger.error(err);
            return Promise.reject(`modifying post ${post.id} failed`);
        }
    }
    /**
     * Modify a post (via its post identifier) using a modifier
     */
    async modifyPostID(post, modifier) {
        return this.modifyPost(await this.getPost(post), modifier);
    }
    /**
     * Modify a post (via fetching the whole post from the partial post identifier) using a modifier
     */
    async modifyPostItem(post, modifier) {
        return this.modifyPost(await this.getPost(post.id), modifier);
    }
    /**
     * Run the post modifier on all specified posts
     */
    async modifyPosts(posts, modifier) {
        const updates = await Promise.all(posts.map((post) => this.modifyPost(post, modifier)));
        const updated = updates.filter((i) => i);
        return updated;
    }
    // =================================
    // THREADS
    /**
     * Fetch the partial information, for all posts of a specific topic
     * Alias of {@link .getPostItemsOfTopic}.
     */
    async getThread(topicID, opts = {}) {
        const topic = await this.getTopic(topicID, opts);
        const [post, ...replies] = await this.getPostItemsOfTopic(topicID, opts);
        return {
            topic,
            post,
            replies,
        };
    }
    /**
     * Fetch the partial information, for all posts of specific topics, grouped by topic
     */
    async getThreads(topicIDs, opts = {}) {
        return await Promise.all(topicIDs.map((id) => this.getThread(id, opts)));
    }
    /**
     * Fetch the partial information, for all posts of specific categories, grouped by topic
     */
    async getThreadsOfCategory(categoryID, opts = {}) {
        // fetch topics for the category
        const topics = await this.getTopicItemsOfCategory(categoryID, opts);
        const topicIDs = topics.map((i) => i.id);
        // return threads
        return await this.getThreads(topicIDs);
    }
    /**
     * Fetch the partial information, for all posts of specific categories, grouped by category, then topic
     */
    async getThreadsOfCategories(categoryIDs, opts = {}) {
        return await Promise.all(categoryIDs.map((id) => this.getThreadsOfCategory(id, opts)));
    }
    async updateUserProfile(userId, prefs) {
        const url = `${this.host}/u/${userId}.json`;
        let data = new FormData();
        data.append('bio_raw', prefs.bio_raw);
        prefs.location && data.append('location', prefs.location);
        prefs.website && data.append('website', prefs.website);
        return await axios.put(url, data, {
            headers: {
                'accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.8',
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                'Api-Key': this.key,
                'Api-Username': this.username
            }
        });
    }
}
export const Instance = (config, key = 'discourse_admin') => {
    return new Discourser(config || CONFIG_DEFAULT()[key]);
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
};
//# sourceMappingURL=index.js.map