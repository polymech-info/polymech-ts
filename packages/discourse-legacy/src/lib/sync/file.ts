import * as path from 'path'
import { sync as exists } from "@polymech/fs/exists"
import { async as move } from "@polymech/fs/move"
import { sync as dir } from "@polymech/fs/dir"
import { sync as write } from "@polymech/fs/write"
import { sync as read } from "@polymech/fs/read"

import { resolve } from "@polymech/commons"

import { Promise as BPromise } from 'bluebird'
import { IOptionsSync, IDiscoursePostBaseOptions } from '../../types'
import { imageName, downloadFile } from './download'


const YAML = require('json-to-pretty-yaml')
const cheerio = require('cheerio');

import { toHTML } from '../markdown'

import {
    SYNC_TRACK_FILENAME
} from '../discourse/constants'

import {
    cacheCategories,
    cacheTags,
    cacheTopics,
    cacheUsers
} from '../discourse/cache'

import {
    Discourser,
    Instance
} from '../discourse'

import {
    fromYAML
} from './commons'

import { EDiscourseConfigKey } from "lib/discourse/constants"
import { ISearchPost, ISearchTopic, logger } from "../../index"

import * as md5 from 'md5'

export const createTopic = async (discourse: Discourser, options: IOptionsSync, content) => {

    let data: any
    try {
        data = await discourse.createPost(options.title, content, options.cat as number)
    } catch (e) {
        debugger
    }

    if (data) {
        logger.debug('created topic : ' + options.title + ' :  ' + data.id)
        if (data && data.id) {

            try {
                options.post_id = data.id;
                options.topic_id = data.topic_id
                await discourse.changeOwner(options.post_id, options.topic_id, options.user_name)
            } catch (e) {
                logger.error('changing owner ' + options.title + ' failed!', e)
            }
        } else {
            logger.debug('creating ' + options.title + ' failed!', data.errors);
            if (data.errors) {
                if (data.errors[0] && data.errors[0] === 'Title has already been used') {
                    logger.error('title already used : ' + options.title)
                }
            }
        }
    }
}

export const updateTopic = async (discourse: Discourser, options: IOptionsSync, topic_id, content) => {

    let data: any
    try {
        data = await discourse.updatePost(topic_id, content)
    } catch (e) {

    }

    if (data) {
        logger.debug('created topic : ' + options.title + ' :  ' + data.id)
        if (data && data.id) {
            try {
                logger.debug('change user to ', options.owner);
                options.post_id = data.id;
                options.topic_id = data.topic_id
                await discourse.changeOwner(topic_id, topic_id, options.user_name)
            } catch (e) {
                logger.debug('changing owner ' + options.title + ' failed!')

            }
        } else {
            logger.debug('creating ' + options.title + ' failed!', data.errors)
            if (data.errors) {
                if (data.errors[0] && data.errors[0] === 'Title has already been used') {
                    logger.error('title already used : ' + options.title)
                }
            }
        }
    }
}

const images_urls = (content: string) => {
    const html = toHTML(content)
    const $ = cheerio.load(html, {
        xmlMode: true
    });

    const images = []
    const links = []
    $('img').each(function () {
        images.push($(this).attr('src'))
    })

    return images
}

const uploadImages = async (content: string, discourse: Discourser, options: IOptionsSync) => {

    const root = path.resolve(resolve(options.root))
    if (!exists(root)) {
        return false
    }

    const track_path = path.join(root, SYNC_TRACK_FILENAME)
    const track = read(track_path, 'json') || {}

    const html = toHTML(content)
    const $ = cheerio.load(html, {
        xmlMode: true
    });

    const images = images_urls(content)

    $('img').each(function () {
        images.push($(this).attr('src'))
    })

    for await (const image of Object.entries(images)) {

        const url: string = image[1]

        if (url.startsWith('upload:')) {
            continue
        }
        if (options.uploadRemote && url.startsWith('http')) {

            const contentHash = md5(content).substring(0, 5)
            const cache_path = path.resolve(resolve('${OSR_CACHE}/discourse-downloads/' + contentHash))
            if (!exists(cache_path)) {
                dir(cache_path)
            }
            const image_name = imageName(url)
            const image_local = path.join(cache_path, image_name)
            if (!exists(image_local)) {
                await downloadFile(url, cache_path)
            }

            if (exists(image_local)) {
                const upped: any = await discourse.uploadFile(options.owner, image_local)
                const data = upped.data;
                if (data && data.id) {
                    track[url] = data
                    write(track_path, track)
                } else {
                    console.error('error uploading image')
                }
            }

            continue
        }

        if (options.uploadLocal) {
            const image_path = path.join(root, url)
            if (exists(image_path) && !track[url]) {
                const upped: any = await discourse.uploadFile(options.owner, image_path)
                const data = upped.data;
                if (data && data.id) {
                    track[url] = data
                    write(track_path, track)
                } else {
                    console.error('error uploading image')
                }
            }
        }
    }

    return track
}

const syncFile = async (file: string, options: IOptionsSync) => {

    const discourse = Instance(null, options.config as EDiscourseConfigKey)

    let content = read(file) as string

    const fm: any = fromYAML(content, options) || {}

    let body = "" + fm.body

    let images_track

    if (options.uploadLocal || options.uploadRemote) {
        images_track = await uploadImages(body, discourse, options)
        const image_urls = images_urls(body)
        image_urls.forEach((i) => {
            if (images_track[i])
                body = body.replace(i, images_track[i].short_url)
        })
    }
    write('./out/md.md', body)

    let dOpts: IDiscoursePostBaseOptions = options.yaml ? fm.attributes : {
        cat: options.cat,
        id: options.id,
        owner: options.owner,
        tags: options.tags,
        title: options.title
    }

    options = {
        ...options,
        ...dOpts
    }

    const cats = await cacheCategories(options, discourse)
    const tags = await cacheTags(options, discourse)
    const users = await cacheUsers(options, discourse)
    const search = await discourse.search(dOpts.title)

    let post_id, topic_id
    if (options.yaml) {
        post_id = dOpts.post_id
        topic_id = dOpts.topic_id
    }


    let dTopic: ISearchTopic
    let dPost: ISearchPost

    if (search.posts && search.topics
        && search.posts[0] && search.topics[0]
        && search.topics[0].title === dOpts.title) {
        dPost = search.posts[0]
        dTopic = search.topics[0]
        topic_id = dTopic.id
        post_id = dPost.id
    } else if (post_id && topic_id) {

    }

    const user = users.find((u) => {
        return u.id === dOpts.owner
    })

    if (!user) {
        logger.error('Invalid user : ', dOpts.owner)
        return false
    }

    options.user_name = user.username

    let topic = null
    if (post_id) {
        topic = await updateTopic(discourse, options, post_id, body)
        if (topic_id) {
            topic = await discourse.updateTopic(topic_id, dOpts.cat as number, dOpts.title, dOpts.tags ? dOpts.tags.split(',') : [])
        }
    } else {
        await createTopic(discourse, options, body)
        topic_id = options.topic_id
        post_id = options.post_id

        await discourse.updateTopic(topic_id, dOpts.cat as number, dOpts.title, dOpts.tags ? dOpts.tags.split(',') : [])
    }

    if (dTopic) {
        options.topic_id = dTopic.id
    }
    if (dPost) {
        options.post_id = dPost.id
    }


    if (options.yaml) {
        let contentOut = `---\n`
        contentOut += YAML.stringify({
            ...fm.attributes,
            topic_id: topic_id,
            post_id: post_id
        })
        contentOut += `---\n`
        contentOut += fm.body
        write(file, contentOut)
    }
    return content

}

export const syncYAML = async (options: IOptionsSync) => {
    await BPromise.resolve(options.srcInfo.FILES).map((f) => {
        return syncFile(f, options)
    }, { concurrency: 1 })

}

export const sync = async (options: IOptionsSync) => {
    return syncYAML(options)
}
