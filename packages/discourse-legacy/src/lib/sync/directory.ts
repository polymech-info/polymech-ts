import * as path from 'path'
import { sync as exists } from "@polymech/fs/exists"
import { async as move } from "@polymech/fs/move"
import { sync as dir } from "@polymech/fs/dir"
import { sync as write } from "@polymech/fs/write"
import { sync as read } from "@polymech/fs/read"

import { resolve } from "@polymech/commons"

import { Promise as BPromise } from 'bluebird'
import { IOptionsSync, IDiscoursePostBaseOptions } from '../../types'

import { createContent } from './osrl'

const YAML = require('json-to-pretty-yaml')
const cheerio = require('cheerio')
const findUp = require('find-up')
const frontMatter = require('front-matter')

import { imageName, downloadFile } from './download'

import { toHTML } from '../markdown'

import { defaultConfig, fromJSON, tracking, trackingPath } from './'

import {

    SYNC_TRACK_FILENAME,
    EDiscourseConfigKey
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
    images_urls
} from './commons'


import { ISearchPost, ISearchTopic } from "../.."

import * as md5 from 'md5'

import { IComponentConfig } from '@polymech/commons'

import { isValidLibraryComponent, readOSRConfig } from '@plastichub/osr-fs-utils'

import { logger } from '../../index'


const fromYAML = (content: string, options: IOptionsSync) => {
    if (frontMatter.test(content)) {
        const fm = frontMatter(content)
        return {
            attributes: fm.attributes,
            body: fm.body
        }
    } else {
        return {
            attributes: {},
            body: content
        }
    }
}



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
        return false
    }

    if (data) {
        logger.debug('created topic : ' + options.title + ' :  ' + data.id)
        if (data && data.id) {
            try {
                logger.debug('change user to ', options.owner);
                options.post_id = data.id;
                options.topic_id = data.topic_id
                await discourse.changeOwner(topic_id, topic_id, options.user_name)
                return true
            } catch (e) {
                logger.debug('changing owner ' + options.title + ' failed!')
                return false
            }
        } else {
            logger.debug('creating ' + options.title + ' failed!', data.errors)
            if (data.errors) {
                if (data.errors[0] && data.errors[0] === 'Title has already been used') {
                    logger.error('title already used : ' + options.title)
                }
                return false
            }
        }
    }
}



const uploadImages = async (content: string, discourse: Discourser, options: IOptionsSync) => {

    const root = path.resolve(resolve(options.root))
    if (!exists(root)) {
        return false
    }

    const track_path = trackingPath(root)
    const track = tracking(root)

    const html = toHTML(content)
    const $ = cheerio.load(html, {
        xmlMode: true
    });

    const images = images_urls(content)

    $('img').each(function () {
        if ($(this).attr('src') && $(this).attr('src').length > 5) {
            images.push($(this).attr('src'))
        }
    })

    for await (const image of Object.entries(images)) {
        const url: string = image[1]

        if (url.length < 10) {
            continue
        }

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
                try {
                    await downloadFile(url, cache_path)
                } catch (e) {
                    continue
                }
            }
            if (!exists(image_local)) {
                continue
            }

            if (!track[url]) {
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

    let config = fromJSON(file, options) || {} as IComponentConfig

    const componentDir = path.parse(file).dir

    let body = await createContent(componentDir, options)

    let images_track

    if (options.uploadLocal || options.uploadRemote) {
        images_track = await uploadImages(body, discourse, options)
        const image_urls = images_urls(body)
        image_urls.forEach((i) => {
            if (images_track[i]) {
                body = body.replace(i, images_track[i].short_url)
            } else {
                logger.warn(`Cant resolve image url : ${i}`)
            }
        })
    }



    const output = path.join(componentDir, '.osr/discourse_raw.md')
    let dst = path.resolve(resolve(output))
    options.debug && logger.info('Write output to: ', dst)
    write(dst, body)

    let dOpts: IDiscoursePostBaseOptions = {
        ...options,
        cat: config.forumCategory,
        id: options.id,
        owner: config.forumUserId || 1,
        tags: config.forumTags as string,
        title: config.name
    }

    options = {
        ...options,
        ...dOpts
    }

    // const cats = await cacheCategories(options, discourse)
    // const tags = await cacheTags(options, discourse)

    const users = await cacheUsers(options, discourse)
    let search = await discourse.search(dOpts.title)

    let post_id, topic_id

    if (options.yaml) {
        post_id = dOpts.post_id
        topic_id = dOpts.topic_id
    }

    let dTopic: ISearchTopic
    let dPost: ISearchPost

    if (search && search.posts && search.topics
        && search.posts[0] && search.topics[0]
        && search.topics[0].title === dOpts.title) {
        dPost = search.posts[0]
        dTopic = search.topics[0]
        topic_id = dTopic.id
        post_id = dPost.id
    } else if (post_id && topic_id) {

    }

    if (!dTopic || !dPost) {
        console.error('cant find ' + dOpts.title)
        // return
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
        await updateTopic(discourse, options, post_id, body)
        if (topic_id) {
            topic = await discourse.updateTopic(topic_id, dOpts.cat as number, dOpts.title, dOpts.tags ? dOpts.tags.split(',') : [])
        }
    } else {
        const d = await createTopic(discourse, options, body)
        if (options.topic_id) {
            topic_id = options.topic_id
            post_id = options.post_id
            await discourse.updateTopic(topic_id, dOpts.cat as number, dOpts.title, dOpts.tags ? dOpts.tags.split(',') : [])
        } else {
            logger.error('Creating topic failed !')
        }
    }

    // const visStatus = await discourse.updateTopicVisibility(topic_id, true)

    // re-read without defaults
    config = readOSRConfig(file)

    if (dTopic) {
        options.topic_id = dTopic.id
        config.forumTopicId = dTopic.id
    }
    if (dPost) {
        options.post_id = dPost.id
        config.forumPostId = dPost.id
    }

    write(file, config)

    return body
}

export const syncComponent = async (options: IOptionsSync) => {

    // let components = options.srcInfo.FILES.filter(isValidLibraryComponent)

    let components = options.srcInfo.FILES.filter(isValidLibraryComponent)
    //components = options.srcInfo.FILES.filter((c) => {
    components = components.filter((c) => {
        try {
            const config = readOSRConfig(c) as any
            if (config) {
                // return !config.code && !config.cscartId && !config.steps
                return !!config.name
            }
            return false
        } catch (error) {
            logger.error(`Invalid config : ${c}`)
        }
    })

    const skipExisting = false

    if (skipExisting) {
        components = components.filter((f) => {
            const config = readOSRConfig(f) as IComponentConfig
            if (config.forumPostId && config.forumTopicId) {
                return false
            }
            return true
        })
    }

    //components = [components[0]]

    await BPromise.resolve(components).map((f) => {
        try {
            return syncFile(f, options)
        } catch (error) {
            debugger
        }

    }, { concurrency: 1 })

}

export const sync = async (options: IOptionsSync) => {
    return syncComponent(options)
}
