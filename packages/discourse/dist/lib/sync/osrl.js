import * as path from 'path';
import { Engine as engine } from '@plastichub/osrl/Engine';
import { parse } from '@plastichub/osrl/options';
import { forward_slash } from '@polymech/commons/glob';
import { resolve } from '@polymech/commons';
import { logger } from '../../index';
import { git_status } from '../git';
import * as moment from 'moment';
import { sync as read } from '@polymech/fs/read';
export const fileAsBuffer = (path) => read(path, 'buffer') || Buffer.from("-");
const variable_extras = async (component, rel, options) => {
    const root = path.resolve(resolve('${OSR_LIBRARY_MACHINES}'));
    const gitStats = await git_status(root, rel);
    const latest = gitStats.latest;
    return {
        "GIT_LAST": moment(latest.date).format('LLLL'),
        "GIT_AUTHOR": latest.author_name,
        "GIT_MESSAGE": latest.message,
        "GIT_COMMIT": latest.hash
    };
};
export const createContent = async (component, _options) => {
    const parts = path.parse(component);
    const rel = forward_slash(path.relative(_options.root, component));
    const extras = await variable_extras(component, rel, _options);
    const variables = {
        root: _options.root,
        cwd: _options.cwd,
        ..._options.variables,
        product: rel,
        product_rel: rel,
        product_rel_min: rel,
        ...extras
    };
    const defaults = {
        language: _options.language,
        debug: false,
        profile: _options.profile,
        //    output: output,
        plugins: [],
        env: _options.env || 'forum',
        cwd: _options.cwd,
        source: _options.src,
        variables
    };
    const options = parse(defaults, defaults);
    const eOptions = {
        ...options,
        root: [
            ...options.profile.includes,
            component
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
    options.debug && logger.info('Compile file ' + component, eOptions);
    let content = await Engine.render(options.source, {
        ...options.variables,
        ...extras
    });
    return content;
};
//# sourceMappingURL=osrl.js.map