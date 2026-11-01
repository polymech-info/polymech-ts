import * as path from 'path'
import { resolveConfig } from "../lib/index"
import { logger } from '../'
import * as StringUtils from '../lib/StringUtils'
import * as HexUtils from '../lib/HexUtils'
import * as Arrays from '../lib/arrays'
import * as Primitives from '../lib/primitives'
import { markdownTable, md2html } from '../lib/markdown'
import * as fm from 'front-matter'
import { forward_slash, sizeToString } from '../lib/fs'
import { CONFIG_DEFAULT, DEFAULT_ROOTS } from '@plastichub/osr-commons'
import { IBaseOptions, IProcessingNode } from '@plastichub/fs/interfaces'
import { sync as iterator } from '@plastichub/fs/iterator'
import { sync as exists } from '@plastichub/fs/exists'
import { sync as write } from '@plastichub/fs/write'
import { sync as read } from '@plastichub/fs/read'
import { ArrayIterator } from '@plastichub/core/iterator'
import { resolve } from "@plastichub/osr-commons"
import { IObjectLiteral } from '@plastichub/core'

import * as env from 'env-var';
import * as os from 'os'
import * as fs from 'fs'
import * as crypto from 'crypto'
import * as cheerio from 'cheerio'
import { Promise as BPromise } from 'bluebird'
import * as cacache from 'cacache'
import { html_beautify } from 'js-beautify'

const convert = require('convert-units')
const fg = require('fast-glob')
const findUp = require('find-up')
const hljs = require('highlight.js')
const prettyHtml = require('json-pretty-html').default
const prettyJSON = require('json-format-highlight')
const TOML = require('@iarna/toml')
const TOMLParser = require('@iarna/toml/lib/toml-parser.js')
const xlsx = require('node-xlsx')
const YAML = require('json-to-pretty-yaml')

///////////////////////////
//
// osr-media stub

export interface Context extends IObjectLiteral {
	markdownTable: (data: any, options?: any) => string
	cacache: any
	cheerio: any
	TOML: any
	frontmatter: any
	logger: any
	config: any
	PATHS: any
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
		resolve: (path: string, alt: boolean, vars: IObjectLiteral) => string[],
		write: (path: string, content: string) => void,
		read: (path: string, type: string) => string | Buffer
	}
}

export const context: Context = {
	convert: convert,
	...StringUtils,
	...HexUtils,
	...Arrays,
	...Primitives,
	markdownTable,
	md2html,
	cacache,
	cheerio,
	logger,
	config: CONFIG_DEFAULT(),
	PATHS: DEFAULT_ROOTS,
	TOML: {
		parse: TOML.parse,
		stringify: TOML.stringify,
		parser: TOMLParser
	},
	frontmatter: fm,
	YAML,
	resolveConfig,
	prettyHtml,
	prettyJSON,
	html_beautify,
	BPromise,
	hljs,
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
		resolve,
		write,
		read: read as any
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
}
