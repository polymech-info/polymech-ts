### Default modules

```ts


import * as StringUtils from '../lib/StringUtils';
import * as HexUtils from '../lib/HexUtils';
import * as Arrays from '../lib/arrays';
import * as Primitives from '../lib/primitives';
import { markdownTable, md2html } from '../lib/markdown';
import { images, forward_slash, sizeToString } from '../lib/fs'
const fg = require('fast-glob');
const YAML = require('json-to-pretty-yaml');
const convert = require('convert-units');
const TOML = require('@iarna/toml');
const TOMLParser = require('@iarna/toml/lib/toml-parser.js');
const findUp = require('find-up');
const xlsx = require('node-xlsx');
import { sync as iterator } from '@plastichub/fs/iterator';
import { sync as exists } from '@plastichub/fs/exists';
import * as env from 'env-var';
import * as os from 'os';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as cheerio from 'cheerio';
import { IgApiClient } from 'instagram-private-api';

const prettyHtml = require('json-pretty-html').default;
const hljs = require('highlight.js');
import * as Discourse from '../plugins/discourser';
import { Promise as BPromise } from 'bluebird';
import * as download from 'download';

import * as elasticsearch from '@elastic/elasticsearch';
import * as cacache from 'cacache';
import { IObjectLiteral } from '../types';
import { IBaseOptions, IProcessingNode } from '@plastichub/fs/interfaces';
import { ArrayIterator } from '@plastichub/core/iterator';
import { git_log, git_status, changelog } from '../lib/git/log';

const prettyJSON = require('json-format-highlight');


export interface Context extends IObjectLiteral {
    markdownTable: (data: any, options?: any) => string;
    images: (src: string) => string[];
    cacache: any;
    cheerio: any;
    elasticsearch: any;
    git: any;
    TOML: any,
    fs: {
        findUp: any,
        iterator: (from: string, options: IBaseOptions) => ArrayIterator<IProcessingNode>
        glob: (path: string, options: any) => string[],
        slash: (s: string) => string,
        EIteratorFlags: {
            MODE: 2,
            TIMES: 4,
            SYMLINKS: 8,
            FILE_SIZE: 16,
            DIRECTORY_SIZE: 32,
            CHECKSUM: 64,
            MIME: 128
        },
        sizeToString: (size: number) => string;
        dir: (dir, glob) => string[];
        path: any,
        exists: (path: string) => boolean | string,
        images: (path: string) => string[]
    }
}
```

### Default context - expanded

```ts

convert: convert,
    ...StringUtils,
    ...HexUtils,
    ...Arrays,
    ...Primitives,
    markdownTable,
    md2html,
    images,
    cacache,
    cheerio,
    elasticsearch,
    IgApiClient,
    TOML: {
        parse: TOML.parse,
        stringify: TOML.stringify,
        parser: TOMLParser
    },
    ig: {
        feed: ig_feed
    },
    Discourse,
    YAML,
    resolveConfig,
    prettyHtml,
    prettyJSON,
    download,
    BPromise,
    hljs,
    git: {
        log: git_log,
        status: git_status,
        print_log: changelog
    },
    xlsx: {
        build: xlsx.build,
        parse: xlsx.parse
    },
    path,
    fs: {
        findUp: findUp,
        iterator: iterator,
        glob: fg,
        slash: forward_slash,
        EIteratorFlags: {
            MODE: 2,
            TIMES: 4,
            SYMLINKS: 8,
            FILE_SIZE: 16,
            DIRECTORY_SIZE: 32,
            CHECKSUM: 64,
            MIME: 128
        },
        sizeToString: sizeToString,
        dir: (dir, glob) => fg.sync(glob, { dot: true, cwd: dir, absolute: true }) as [],
        ...fs,
        path,
        exists,
        images
    },
    os: {
        env: env,
        ...os
    },
    crypto: {
        ...crypto,
        encrypt: (text, password, algorithm = 'aes-256-cbc') => {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, password, iv);
            let crypted = cipher.update(text, 'utf8', 'hex');
            crypted += cipher.final('hex');
            return crypted;
        },
        decrypt: (text, password, algorithm = 'aes-128-ecb') => {
            const iv = crypto.randomBytes(16);
            const decipher = crypto.createCipheriv(algorithm, password, iv)
            let dec = decipher.update(text, 'hex', 'utf8');
            dec += decipher.final('utf8');
            return dec;
        }
    }
```