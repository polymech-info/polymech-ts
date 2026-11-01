import * as path from 'path';
import { sync as read } from "@polymech/fs/read";
import { SYNC_TRACK_FILENAME } from '../discourse/constants';
const YAML = require('json-to-pretty-yaml');
const cheerio = require('cheerio');
const findUp = require('find-up');
const frontMatter = require('front-matter');
import { readOSRConfig } from '@plastichub/osr-fs-utils';
export const trackingPath = (root) => path.join(root, SYNC_TRACK_FILENAME);
export const tracking = (root) => read(trackingPath(root), 'json') || {};
export const defaultConfig = (configFile, options) => {
    let defaultsJSON = findUp.sync('defaults.json', {
        cwd: path.parse(configFile).dir,
        stopAt: options.root
    });
    if (defaultsJSON) {
        return readOSRConfig(defaultsJSON);
    }
    return {};
};
export const fromJSON = (configFile, options) => {
    const defaults = defaultConfig(configFile, options);
    const config = readOSRConfig(configFile);
    return {
        ...defaults,
        ...config
    };
};
//# sourceMappingURL=index.js.map