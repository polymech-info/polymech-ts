import * as path from 'path';
import { Engine as engine } from '@plastichub/osrl/Engine';
import { parse } from '@plastichub/osrl/options';
import { pathInfo } from '@polymech/commons/glob';
import { resolve } from '@polymech/commons';
import { logger } from '../../';
import { sync as exists } from '@polymech/fs/exists';
import { sync as read } from '@polymech/fs/read';
import { sync as write } from '@polymech/fs/write';
import { Promise as BPromise } from 'bluebird';
import { MODULE_NAME } from '../../constants';
const chokidar = require("chokidar");
const cheerio = require('cheerio');
const frontMatter = require('front-matter');
export const fileAsBuffer = (path) => read(path, 'buffer') || Buffer.from("-");
import { get_cached, set_cached } from '@plastichub/osr-cache/lib';
import { OSR_CACHE } from '@polymech/commons';
import * as md5 from 'md5';
import { RMark, toHTML } from '../markdown';
export const images_urls = (content) => {
    const html = toHTML(content);
    const $ = cheerio.load(html, {
        xmlMode: true
    });
    const images = [];
    const links = [];
    $('img').each(function () {
        images.push($(this).attr('src'));
    });
    return images;
};
export const adjustUrls = (content, options) => {
    let ret = new RMark({
        images: (match, capture, arg1, arg2) => `![${capture}](${arg1})`,
        //links: (match, capture, arg1, arg2) => `[${capture}](${arg1})`
    }).render(content);
    return ret;
};
export const fromJSON = (content, file, options) => {
};
export const fromYAML = (content, options) => {
    if (frontMatter.test(content)) {
        const fm = frontMatter(content);
        return {
            attributes: fm.attributes,
            body: fm.body
        };
    }
    else {
        return {
            attributes: {},
            body: content
        };
    }
};
// to be changed to osr-defaults
export const option = (option, taskOptions, col, _default) => {
    // support grunt or yargs
    const val = col.option ? col.option : (option) => col[option];
    let ret = taskOptions[option] !== undefined ? taskOptions[option] : _default;
    if (val(option) !== undefined) {
        ret = val(option);
    }
    return ret;
};
export const createContent = async (file, _options) => {
    const parts = path.parse(file);
    const rel = path.relative(_options.root, file);
    let output = _options.output;
    let outputInfo = pathInfo(_options.output);
    const variables = {
        root: '.',
        cwd: _options.cwd || path.resolve('.'),
        ..._options.variables
    };
    if (!outputInfo.FILE_EXT) {
        output = path.resolve(`${_options.output}/${path.parse(rel).dir}/${parts.name}.md`);
    }
    else {
        output = path.resolve(resolve(output, false, variables));
    }
    const defaults = {
        language: _options.lang,
        debug: _options.debug,
        profile: _options.profile,
        output: output,
        plugins: _options.plugins,
        env: _options.env || 'library',
        cwd: _options.cwd || path.resolve('.'),
        source: file,
        variables
    };
    const options = parse(defaults, defaults);
    const eOptions = {
        ...options,
        root: [
            ...options.profile.includes,
            path.parse(file).dir
        ],
        toHTML: false,
        cache: false,
        keepOutputType: true,
        trimTagRight: false,
        trimTagLeft: false,
        trimOutputRight: false,
        trimOutputLeft: false,
        greedy: false
    };
    const Engine = new engine(eOptions);
    options.source = path.resolve(options.source);
    const osr_cache = OSR_CACHE();
    const cached = await get_cached(options.source, eOptions, _options.module || MODULE_NAME);
    if (osr_cache && cached && _options.cache !== false) {
        options.debug && logger.info('Compile file serving from cache: ' + options.source);
        let md5Src = md5(Buffer.from(cached));
        let md5Dst = md5(fileAsBuffer(options.output));
        if (!exists(options.output) || md5Src !== md5Dst) {
            write(options.output, cached);
        }
        return cached;
    }
    options.debug && logger.info('Compile file ' + file, eOptions);
    let content = await Engine.render(options.source, options.variables);
    if (_options.onCompiled) {
        content = await _options.onCompiled(options.source, output, content);
    }
    if (osr_cache && _options.cache !== false) {
        options.debug && logger.info('Write output to cache', output);
        await set_cached(options.source, eOptions, _options.module || MODULE_NAME, content);
    }
    let dst = path.resolve(resolve(output, false, options.variables));
    _options.debug && logger.info('Write output to: ', dst);
    write(dst, content);
    if (_options.onCompileDone) {
        await _options.onCompileDone(options.source, dst, options, content);
    }
    return content;
};
const watch = async (src, options) => {
    src = path.resolve(src);
    const watcher = chokidar.watch(`${src}`, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });
    watcher.on('change', async (path) => {
        await createContent(path, options);
    });
    return watcher;
};
const compileAll = async (files, options) => {
    return await BPromise.resolve(files).map((f) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                createContent(f, options).then(() => resolve(true));
            }, 50);
        });
    }, { concurrency: 1 });
};
const compileAllEx = async (files, options) => {
    return await BPromise.resolve(files).map((f) => {
        return createContent(f, options);
    }, { concurrency: 1 });
};
//# sourceMappingURL=commons.js.map