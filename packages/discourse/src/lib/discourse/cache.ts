
import { Promise as BPromise } from 'bluebird'
import { sync as read } from '@polymech/fs/read'
import { sync as exists } from '@polymech/fs/exists'
import { sync as write } from '@polymech/fs/write'
import { resolve } from '@polymech/commons'


import {
    IDiscourseUser
} from '../../index.js'


import {
    DISCOURSE_CATEGORY_CACHE,
    DISCOURSE_TAGS_CACHE,
    DISCOURSE_USER_CACHE,
} from '../discourse/constants.js'


import { Discourser } from '../index.js'

import * as path from 'path'

export const fileAsBuffer = (path: string) => read(path, 'buffer') as Buffer || Buffer.from("-")

import { get_cached, set_cached } from '@polymech/cache/lib'
import { OSR_CACHE } from '@polymech/commons'


import {
    MODULE_NAME
} from '../../constants.js'


export const cacheCategories = async (options: any, discourse: Discourser) => {

    const osr_cache = OSR_CACHE()

    const cPath = path.resolve(resolve(DISCOURSE_CATEGORY_CACHE))

    const cached = exists(cPath) ? await get_cached(cPath, {}, MODULE_NAME) : null

    if (osr_cache && cached && options.cache !== false) {
        return JSON.parse(cached)
    }

    let cats = await discourse.getCategories({
        include_subcategories: true
    })

    write(cPath, cats)

    if (osr_cache && options.cache !== false) {
        await set_cached(cPath, {}, MODULE_NAME, cats)
    }

    return cats
}

export const cacheTopics = async (options: any, discourse: Discourser) => {

}

let uPage = 1
let usersAll = []

export const _getForumUsers = async (d: Discourser, page, detail) => {

    const uPath = path.resolve(resolve(DISCOURSE_USER_CACHE))

    if (uPage == 1) {
        usersAll = []
    }
    let users: any = await d.getUsers(page)
    if (users.length) {
        usersAll = usersAll.concat(users)
        uPage++
        return _getForumUsers(d, uPage, detail)
    } else {
        uPage = 1

        write(uPath, usersAll)

        let fUsers: IDiscourseUser[] = read(uPath, 'json') || [] as any

        const add = async (u: IDiscourseUser) => {
            return new Promise((resolve, reject) => {
                let fUser = fUsers.find((fu) => u.id == fu.id)
                if (!fUser) {
                    fUsers.push(u)
                    fUser = u
                }

                if (fUser.detail) {
                    console.log('Retrieve User Detail ' + u.name)
                    setTimeout(() => {
                        d.getUser(fUser.id).then((detail) => {
                            if (detail) {
                                fUser.detail = detail
                            }
                            write(uPath, fUsers)
                            resolve(fUser)
                        })
                    }, 200)
                } else {
                    resolve(fUser)
                }
            })
        }
        return await BPromise.resolve(usersAll).map((u: IDiscourseUser) => {
            return add(u)
        }, { concurrency: 1 })

    }
}
export const getForumUsers = async (d, detail): Promise<IDiscourseUser[]> => {
    return _getForumUsers(d, uPage, detail)
}

export const cacheUsers = async (options, discourse: Discourser): Promise<IDiscourseUser[]> => {

    const osr_cache = OSR_CACHE()
    const uPath = path.resolve(resolve(DISCOURSE_USER_CACHE))

    const cached = exists(uPath) ? await get_cached(uPath, {}, MODULE_NAME) : null

    if (osr_cache && options.cache !== false && exists(uPath)) {
        return read(uPath, 'json') as any
    }

    if (osr_cache && cached && options.cache !== false) {
        return JSON.parse(cached)
    }

    let users = await getForumUsers(discourse, false)

    write(uPath, users)

    if (osr_cache && options.cache !== false) {
        await set_cached(uPath, {}, MODULE_NAME, users)
    }

    return users

}

export const cacheTags = async (options, discourse: Discourser) => {
    const osr_cache = OSR_CACHE()
    const tPath = path.resolve(resolve(DISCOURSE_TAGS_CACHE))

    const cached = exists(tPath) ? await get_cached(tPath, {}, MODULE_NAME) : null

    if (osr_cache && cached && options.cache !== false) {
        return JSON.parse(cached)
    }

    let tags = await discourse.getTags()
    write(tPath, tags)

    if (osr_cache && options.cache !== false) {
        await set_cached(tPath, {}, MODULE_NAME, tags)
    }

    return tags
}