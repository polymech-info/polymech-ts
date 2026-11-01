
import { Promise as BPromise } from 'bluebird'
import { IUploadedFileMeta } from '@polymech/commons'
import { forward_slash } from '@polymech/commons'

import {
    IOptions,
    IImportUser,
    IOAHowto,
    IOACategory,
    IOATags,
    IOAHowtoImport
} from '../../'

import {
    logger
} from '../../index'

import {
    HT_CATS
} from '../discourse/constants'


import { Discourser } from '../index'
import { sanitize, convert } from './lib'

import * as path from 'path'
import { sync as read } from '@polymech/fs/read'
import { sync as exists } from '@polymech/fs/exists'

import { sync as write } from '@polymech/fs/write'

import { resolve } from '@polymech/commons'

import * as cheerio from 'cheerio'
import { getUsers, get_user_name } from './users'

import { html_beautify } from 'js-beautify'
import { Converter } from 'showdown'
var escapeHtml = require('escape-html');
import { sync as mkdir } from '@polymech/fs/dir'
import { files } from '@polymech/commons'
const pretty = require('pretty')


const TEST = false

export const DEFAULT_HT_CATEGORY = {
    "_modified": "2022-09-18T08:51:47.196Z",
    "label": "Guides",
    "_id": "CrZjHORWfxEl6iDrrPIO",
    "_created": "2022-09-18T08:51:47.196Z",
    "_deleted": false
}


export const LATEST_TRACK = '${OSR_ROOT}/oa-data/howtos/latest_track.json'
export const LATEST_TEST = './latest_test.json'

export const DEFAULT_USER = 'katharinaelleke'

export const getDataPath = (_path = '') => path.resolve(path.join(resolve('${OSR_ROOT}/oa-data/howtos/'), _path))
export const getHowtosPath = () => path.resolve(resolve(TEST ? LATEST_TEST : LATEST_TRACK))
export const getHowtos = () => (read(path.resolve(getHowtosPath()), 'json') as any) as IOAHowtoImport[] || []

export const read_howtos = (src: string): IOAHowtoImport[] => {
    const raw = read(src, 'json') as any
    return raw.v3_howtos
}

export const read_categories = (src: string): IOACategory[] => {
    const raw = read(src, 'json') as any
    return raw.v3_categories
}

export const read_tags = (src: string): IOATags[] => {
    const raw = read(src, 'json') as any
    return raw.v3_tags
}

export const filter_valid = (users: IOAHowtoImport[]) => {
    return users.filter((user) => {
        if (user.title === 'Build a Fishing Canoe') {
            //debugger
        }
        if (user.moderation.toLowerCase() !== 'accepted') {
            return false
        }
        return true;
    })
}

export const kb_howto_folder = (howto) => path.resolve(path.join(resolve("${KB_ROOT}/src/howtos/"), howto.slug))
export const kb_howto_file = (howto, filename) => path.resolve(path.join(resolve("${KB_ROOT}/src/howtos/"), howto.slug, sanitize(filename)))

export const getHowtoUser = (howto: IOAHowto) => {
    const users = getUsers()
    let user = users.find((u) => u._id == howto._createdBy)
    if (user && user.f_id) {
        return user
    } else {
        user = users.find((u) => u._id == DEFAULT_USER)
        if (user && user.f_id) {
            console.error('using default user : ' + DEFAULT_USER + ' : for' + howto.slug)
            return user
        }
    }
}

export const toMDImage = (image: IUploadedFileMeta) => `![](${image.data.short_url})`

export const md_edit_wrap = (content, f, prefix = '', context = '') =>
    html_beautify(`<div prefix="${prefix}" file="${path.parse(f).base}" context="${context}" class="fragment">${content}</div>`)

export const removeEmojis = (string) => {
    return string.replace(/([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g, '');
}

export const toHTML = (path, markdown) => {
    const content = read(path, 'string') as string;
    if (!markdown) {
        let converter = new Converter({ tables: true });
        converter.setOption('literalMidWordUnderscores', 'true');
        return converter.makeHtml(content);
    } else {
        return content;
    }
}

export const createTextLinks_ = (text) => {
    return (text || "").replace(
        /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
        function (match, space, url) {
            var hyperlink = url
            if (!hyperlink.match('^https?:\/\/')) {
                hyperlink = 'http://' + hyperlink
            }
            return space + '<a href="' + hyperlink + '">' + url + '</a>'
        }
    )
}