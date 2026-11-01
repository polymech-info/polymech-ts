import * as path from 'path'
import { sync as read } from "@polymech/fs/read"
import {
    SYNC_TRACK_FILENAME
} from '../discourse/constants'

import { sync as exists } from "@polymech/fs/exists"
import { async as move } from "@polymech/fs/move"
import { sync as dir } from "@polymech/fs/dir"
import { sync as write } from "@polymech/fs/write"

import { resolve } from "@polymech/commons"

import { Promise as BPromise } from 'bluebird'
import { IOptionsSync, IDiscoursePostBaseOptions } from '../../types'

import { createContent } from './osrl'

const YAML = require('json-to-pretty-yaml')
const cheerio = require('cheerio')
const findUp = require('find-up')
const frontMatter = require('front-matter')

import { imageName, downloadFile } from './download'
import { IComponentConfig } from '@polymech/commons'
import { isValidLibraryComponent, readOSRConfig } from '@plastichub/osr-fs-utils'

export const trackingPath = (root) =>
    path.join(root, SYNC_TRACK_FILENAME)


export const tracking = (root) =>
    read(trackingPath(root), 'json') || {}

export const defaultConfig = (configFile: string, options: IOptionsSync): IComponentConfig => {
    let defaultsJSON = findUp.sync('defaults.json', {
        cwd: path.parse(configFile).dir,
        stopAt: options.root
    })
    if (defaultsJSON) {
        return readOSRConfig(defaultsJSON)
    }
    return {

    } as IComponentConfig
}

export const fromJSON = (configFile: string, options: IOptionsSync): IComponentConfig => {
    const defaults = defaultConfig(configFile, options)
    const config = readOSRConfig(configFile)
    return {
        ...defaults,
        ...config
    }
}