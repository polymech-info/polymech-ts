import * as path from 'path';
import { sync as exists } from "@polymech/fs/exists";
import { sync as dir } from "@polymech/fs/dir";
import { sync as write } from "@polymech/fs/write";
import { resolve } from "@polymech/commons";
import { Promise as BPromise } from 'bluebird';
import { createContent } from './osrl';
const YAML = require('json-to-pretty-yaml');
const cheerio = require('cheerio');
const findUp = require('find-up');
const frontMatter = require('front-matter');
const md5 = require('md5');
import { imageName, downloadFile } from './download';
import { toHTML } from '../markdown';
import { isNumber } from '@polymech/core/primitives';
import { fromJSON, tracking, trackingPath } from './';
import { cacheUsers } from '../discourse/cache';
import { Instance } from '../discourse';
import { images_urls } from './commons';
import { isValidLibraryComponent, readOSRConfig } from '@plastichub/osr-fs-utils';
import { logger } from '../../index';
import { forward_slash } from '@polymech/commons';
const CONTENT_TEST = false;
const SKIP_EXISTING = false;
export const createPost = async (discourse, options, content) => {
    if (!isNumber(options.cat)) {
        logger.error(`category not a number! ${options.title} `);
    }
    let data;
    try {
        data = await discourse.createPost(options.title, content, options.cat);
    }
    catch (e) {
        debugger;
    }
    if (data) {
        if (data && data.id) {
            try {
                options.post_id = data.id;
                options.topic_id = data.topic_id;
                await discourse.changeOwner(options.post_id, options.topic_id, options.user_name);
                logger.debug('created topic : ' + options.title + ' :  ' + data.id + ' | topic id :' + data.topic_id);
                return true;
            }
            catch (e) {
                logger.error('changing owner ' + options.title + ' failed!', e);
            }
        }
        else {
            logger.debug('creating ' + options.title + ' failed!', data.errors, data);
            if (data.errors) {
                if (data.errors[0] && data.errors[0] === 'Title has already been used') {
                    logger.error('title already used : ' + options.title);
                }
            }
        }
    }
    else {
        return false;
    }
};
export const updatePost = async (discourse, options, topic_id, content) => {
    let data;
    try {
        data = await discourse.updatePost(topic_id, content);
        logger.debug('update post : ' + options.title + ' :  ' + data.id + ' | topic id ' + data.topic_id);
    }
    catch (e) {
        return false;
    }
    if (data) {
        if (data && data.id) {
            try {
                // logger.debug('change user to ', options.owner);
                options.post_id = data.id;
                options.topic_id = data.topic_id;
                await new Promise(f => setTimeout(f, 1000));
                await discourse.changeOwner(topic_id, topic_id, options.user_name);
                return true;
            }
            catch (e) {
                logger.debug('changing owner ' + options.title + ' failed!');
                return false;
            }
        }
        else {
            logger.debug('creating ' + options.title + ' failed!', data.errors);
            if (data.errors) {
                if (data.errors[0] && data.errors[0] === 'Title has already been used') {
                    logger.error('title already used : ' + options.title);
                }
                return false;
            }
        }
    }
};
const uploadImages = async (content, discourse, options) => {
    const root = path.resolve(resolve(options.root));
    if (!exists(root)) {
        return false;
    }
    const track_path = trackingPath(root);
    const track = tracking(root);
    const html = toHTML(content);
    const $ = cheerio.load(html, {
        xmlMode: true
    });
    const images = images_urls(content);
    $('img').each(function () {
        if ($(this).attr('src') && $(this).attr('src').length > 5) {
            images.push($(this).attr('src'));
        }
    });
    for await (const image of Object.entries(images)) {
        const url = image[1];
        if (url.length < 10) {
            continue;
        }
        if (url.startsWith('upload:')) {
            continue;
        }
        if (options.uploadRemote && url.startsWith('http')) {
            const contentHash = md5(content).substring(0, 5);
            const cache_path = path.resolve(resolve('${OSR_CACHE}/discourse-downloads/' + contentHash));
            if (!exists(cache_path)) {
                dir(cache_path);
            }
            const image_name = imageName(url);
            const image_local = path.join(cache_path, image_name);
            if (!exists(image_local)) {
                try {
                    await downloadFile(url, cache_path);
                }
                catch (e) {
                    continue;
                }
            }
            if (!exists(image_local)) {
                continue;
            }
            if (!track[url]) {
                const upped = await discourse.uploadFile(options.owner, image_local);
                const data = upped.data;
                if (data && data.id) {
                    track[url] = data;
                    write(track_path, track);
                }
                else {
                    console.error('error uploading image');
                }
            }
            continue;
        }
        if (options.uploadLocal) {
            const image_path = path.join(root, url);
            if (exists(image_path) && (!track[url] || options.cache === false)) {
                const upped = await discourse.uploadFile(options.owner, image_path);
                const data = upped.data;
                if (data && data.id) {
                    track[url] = data;
                    write(track_path, track);
                }
                else {
                    console.error('error uploading image');
                }
            }
        }
    }
    return track;
};
const syncFile = async (file, options) => {
    const discourse = Instance(null, options.config);
    let config = fromJSON(file, options) || {};
    const componentDir = path.parse(file).dir;
    // ph3 back sync
    const rel = forward_slash(path.relative(options.root, componentDir));
    const productConfigPath = path.join(options.product_root, rel, 'config.json');
    let body = await createContent(componentDir, options);
    let images_track;
    if (options.uploadLocal || options.uploadRemote) {
        images_track = await uploadImages(body, discourse, options);
        const image_urls = images_urls(body);
        image_urls.forEach((i) => {
            if (images_track[i]) {
                body = body.replace(i, images_track[i].short_url);
            }
            else {
                logger.warn(`Cant resolve image url : ${i} - ${componentDir} ! Image Upload track invalid`);
            }
        });
    }
    logger.debug(`Processing ${componentDir}`);
    const output = path.join(componentDir, '.osr/discourse_raw.md');
    let dst = path.resolve(resolve(output));
    options.debug && logger.info('Write output to: ', dst);
    write(dst, body);
    let post_id, topic_id;
    let dOpts = {
        ...options,
        cat: config.forumCategory,
        id: options.id,
        owner: config.forumUserId || 1,
        tags: config.forumTags,
        title: config.name,
        topic_id: config.forumTopicId,
        post_id: config.forumPostId
    };
    options = {
        ...options,
        ...dOpts
    };
    const hash = md5(JSON.stringify({
        cat: dOpts.cat,
        tags: dOpts.tags,
        owner: dOpts.owner,
        body,
        title: dOpts.title
    }, null));
    // const cats = await cacheCategories(options, discourse)
    // const tags = await cacheTags(options, discourse)
    const users = await cacheUsers(options, discourse);
    await new Promise(f => setTimeout(f, 1000));
    let search = await discourse.search(dOpts.title);
    await new Promise(f => setTimeout(f, 2000));
    let dTopic;
    let dPost;
    if (search && search.posts && search.topics) {
        search.topics.forEach((t, i) => {
            if (t.title === dOpts.title) {
                dTopic = t;
                dPost = search.posts[i];
                topic_id = dTopic.id;
                post_id = dPost.id;
            }
        });
    }
    if (!dTopic || !dPost) {
        console.error('!dTopic || !dPost : cant find ' + dOpts.title);
        // return
    }
    const user = users.find((u) => {
        return u.id === dOpts.owner;
    });
    if (!user) {
        logger.error('Invalid user : ', dOpts.owner);
        return false;
    }
    options.user_name = user.username;
    if (SKIP_EXISTING && hash === config.forumPostHash &&
        config.forumTopicId && config.forumPostId) {
        return;
    }
    if (CONTENT_TEST) {
        return;
    }
    if (post_id) {
        if (await updatePost(discourse, options, post_id, body)) {
            if (topic_id) {
                await new Promise(f => setTimeout(f, 2000));
                await discourse.updateTopic(topic_id, dOpts.cat, dOpts.title, dOpts.tags ? dOpts.tags.split(',') : []);
            }
        }
        else {
            logger.error(`Error updating post ${dOpts.title}`);
        }
    }
    else {
        if (await createPost(discourse, options, body)) {
            await new Promise(f => setTimeout(f, 1000));
            await discourse.updateTopic(options.topic_id, dOpts.cat, dOpts.title, dOpts.tags ? dOpts.tags.split(',') : []);
        }
        else {
            logger.error('Creating post failed !', dOpts.title);
        }
    }
    // const visStatus = await discourse.updateTopicVisibility(topic_id, true)
    // re-read without defaults
    config = readOSRConfig(file);
    config.forumPostHash = hash;
    if (dTopic) {
        config.forumTopicId = dTopic.id;
    }
    else if (topic_id) {
        config.forumTopicId = topic_id;
    }
    if (dPost) {
        config.forumPostId = dPost.id;
    }
    else if (post_id) {
        config.forumPostId = post_id;
    }
    write(file, config);
    //ph3 products
    if (exists(productConfigPath)) {
        let pConfig = readOSRConfig(productConfigPath);
        logger.debug(`Updating product config ${productConfigPath}`);
        pConfig = {
            ...config
            //...pConfig,
            //...
            /*
            forumTopicId:config.forumTopicId,
            forumPostId:config.forumPostId,
            forumPostHash: config.forumPostHash
            */
        };
        write(productConfigPath, pConfig);
    }
    return body;
};
export const syncComponent = async (options) => {
    let components = options.srcInfo.FILES.filter(isValidLibraryComponent);
    //let components = options.srcInfo.FILES.filter((c) => {
    //components = components.filter((c) => { 
    /*
try {
    const config = readOSRConfig(c) as IComponentConfig
    if (config) {
        if (config.forum === false) {
            return false
        }
        // return !config.code && !config.cscartId && !config.steps
        return !!config.name
    }
    return false
} catch (error) {
    logger.error(`Invalid config : ${c}`)
}
})*/
    const skipExisting = options.skip;
    /*
    [
        "C:/Users/mc007/Desktop/osr/osr-machines/shredder/asterix-pp/config.json",
        "C:/Users/mc007/Desktop/osr/osr-machines/shredder/asterix-sm-morren/config.json",
        "C:/Users/mc007/Desktop/osr/osr-machines/shredder/bicycle-shredder/config.json",
        "C:/Users/mc007/Desktop/osr/osr-machines/shredder/idefix/config.json",
        "C:/Users/mc007/Desktop/osr/osr-machines/shredder/obelix/config.json",
        "C:/Users/mc007/Desktop/osr/osr-machines/shredder/pp-v3.3/config.json",
        "C:/Users/mc007/Desktop/osr/osr-machines/shredder/components/shredder_v21-light-ex/config.json",
        "C:/Users/mc007/Desktop/osr/osr-machines/shredder/components/shredder_v31-light/config.json",
      ]
      */
    if (skipExisting) {
        components = components.filter((f) => {
            const config = readOSRConfig(f);
            if (config.forumPostId && config.forumTopicId) {
                return false;
            }
            return true;
        });
    }
    //components = [components[0]]
    logger.info(`Syncing ${components.length} components`, components);
    await BPromise.resolve(components).map((f) => {
        try {
            return syncFile(f, options);
        }
        catch (error) {
            debugger;
        }
    }, { concurrency: 1 });
};
export const sync = async (options) => {
    return syncComponent(options);
};
//# sourceMappingURL=component.js.map