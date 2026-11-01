import { resolve, join } from 'node:path'
import * as ssri from 'ssri'
import { get as cache_get, put as cache_put, rm as cache_rm } from 'cacache'
import { sync as exists } from '@polymech/fs/exists'
import { sync as mkdir } from '@polymech/fs/dir'
import { isString, isObject, isArray } from '@polymech/core/primitives'
import { OSR_CACHE } from '@polymech/commons'
import { sync as read } from '@polymech/fs/read'
import { logger } from '../index.js'

export const cache_path = (_namespace: string) => `${resolve(join(OSR_CACHE(), _namespace))}`
export const fileAsBuffer = (path: string) => read(path, 'buffer') as Buffer

export const file_hash = (path: string, opts: any = {}, namespace: string = "nons") => {
    const hash = { ...opts, ns: namespace }
    delete hash['debug']
    delete hash['verbose']
    const buffer = fileAsBuffer(path) as Buffer
    const ibuffer = Buffer.concat([buffer, Buffer.from(JSON.stringify(hash))])
    const ret = ssri.fromData(ibuffer).toString()
    return ret
}

export const object_hash = (opts: any = {}, namespace: string = "nons") => {
    const hash = { ...opts, ns: namespace }
    const ibuffer = Buffer.concat([Buffer.from(JSON.stringify(hash))])
    const ret = ssri.fromData(ibuffer).toString()
    return ret
}

export const file_name_hash = (path: string, opts: any = {}, namespace: string = "nons") => {
    const ibuffer = Buffer.concat([Buffer.from(path), Buffer.from(JSON.stringify({ ...opts, ns: namespace }))])
    const ret = ssri.fromData(ibuffer).toString()
    return ret
}

export const set_cached = async (path: string, opts: any = {}, namespace: string = "nons", data: any, metadata: any = {}) => {
    const c_integrity = file_hash(path, opts, namespace)
    const c_dir = cache_path(namespace)
    if (!exists(c_dir)) {
        mkdir(c_dir)
    }
    if (!Buffer.isBuffer(data)) {
        if (!isString(data) && (isArray(data) || isObject(data))) {
            data = JSON.stringify(data, null, 2)
        }
    }
    return await cache_put(c_dir, c_integrity, data, {
        metadata: {
            path: path,
            hash: c_integrity,
            ...metadata
        }
    })
}

export const set_cached_object = async (opts: any = {}, namespace: string = "nons", data: any, metadata: any = {}) => {
    const c_integrity = object_hash(opts, namespace)
    const c_dir = cache_path(namespace)
    
    if (!exists(c_dir)) {
        mkdir(c_dir)
    }
    if (!Buffer.isBuffer(data)) {
        if (!isString(data) && (isArray(data) || isObject(data))) {
            try {
                data = JSON.stringify(data, null, 2)
            } catch (e) {
                logger.error(`osr-cache :: error serializing object: ${e}`, opts)
                return false
            }
        }
    }
    return await cache_put(c_dir, c_integrity, data, {
        metadata: {
            hash: c_integrity,
            ...metadata
        }
    })
}

export const get_cache_key = async (path: string, opts: any = {}, namespace: string = "nons") => {
    const c_integrity = file_hash(path, opts, namespace)
    const c_dir = cache_path(namespace)
    try {
        const cached = await cache_get.info(c_dir, c_integrity)
        if (cached) {
            return cached
        }
    } catch (e) {
        logger.error(e)
    }
}
export const get_cached = async (path: string, opts: any = {}, namespace: string = "nons") => {
    const c_integrity = file_hash(path, opts, namespace)
    const c_dir = cache_path(namespace)
    if (!exists(c_dir)) {
        mkdir(c_dir)
    }
    let data: any
    try {
        const cached = await cache_get.info(c_dir, c_integrity)
        if (cached) {
            data = ((await cache_get(c_dir, c_integrity)).data as Buffer).toString()
        }

    } catch (e) {
        logger.error(e)
    }
    return data
}

export const get_cached_object = async (opts: any = {}, namespace: string = "nons") => {
    const c_integrity = object_hash(opts, namespace)
    const c_dir = cache_path(namespace)
    if (!exists(c_dir)) {
        mkdir(c_dir)
    }
    let data: any
    try {
        const cached = await cache_get.info(c_dir, c_integrity)
        if (cached) {
            data = ((await cache_get(c_dir, c_integrity)).data as Buffer).toString()
        }

    } catch (e) {
        logger.error(e)
    }
    if (data && isString(data)) {
        try {
            data = JSON.parse(data)
        } catch (e) {
            logger.error(`Error parsing cached object: ${e.message}`)
        }
    }
    return data
}

export const rm_cached_object = async (opts: any = {}, namespace: string = "nons") => {
    const c_integrity = object_hash(opts, namespace)
    const c_dir = cache_path(namespace)
    if (!exists(c_dir)) {
        mkdir(c_dir)
    }
    let data: any
    try {
        const cached = await cache_get.info(c_dir, c_integrity)
        if (cached) {
            await cache_rm(c_dir, c_integrity)
        }
    } catch (e) {
        logger.error(e)
    }
    return data
}

export const get_path_cached = async (path: string, opts: any = {}, namespace: string = "nons") => {
    const c_integrity = file_hash(path, opts, namespace)
    const c_dir = cache_path(namespace)
    if (!exists(c_dir)) {
        mkdir(c_dir)
    }
    let data: any
    try {
        const cached = await cache_get.info(c_dir, c_integrity)
        if (cached) {
            return cached.path
        }

    } catch (e) {
        logger.error(e)
    }
    return data
}