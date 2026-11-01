import * as path from 'path'
import * as _ from './liquid/underscore'
import { Liquid, Context as LContext } from './liquidjs/liquid'
import { engineDefault } from './liquid'
import { exists, existsSync, readFile, readFileSync, resolve } from './fs'
import { LiquidOptions } from './liquidjs/liquid-options'
import { stringify } from 'yaml'
import { IObjectLiteral } from '@plastichub/core'
export { sync as dir } from '@plastichub/fs/dir'
import { sync as read } from '@plastichub/fs/read'
import { sync as write } from '@plastichub/fs/write'
import { sync as rm } from '@plastichub/fs/remove'
import { resolve as resolve_path } from "@plastichub/osr-commons"

import { runJS, runJSExpression, runJSExpressionEx } from './plugins/js'
import { register as registerDSTag } from './plugins/ds'
import { register as registerJS } from './plugins/js'
import { register as registerI18n, i18n } from './plugins/i18n'
import { register as registerPrint } from './plugins/print'
import { register as registerOpenAI, openAI } from './plugins/osr-ai'
import { markdown } from './plugins/turndown'
import { html, pretty } from './plugins/html'
import { register as registerMInclude } from './plugins/minclude'
import { register as registerGET } from './plugins/get'

import { Context } from './conf/bootstrap'
import { IOptions } from './types'
import { defaultFS } from './fs'
import { md2html } from './filters'
import { substitute, logger } from './index'

import { html_beautify } from 'js-beautify'
const fm = require('front-matter')

let _engine: Engine
export const getEngine = (): Engine => _engine
export const getContext = (): Context => _engine.context

export class LiquidEx extends Liquid {
	owner: Engine
}

export class Engine {
	constructor(options: IOptions) {
		this.engine = engineDefault(options) as LiquidEx
		this.options = options || {} as IOptions
		this.expressionCache = {}
		this.global = {}
		this.stats = {
			imports: []
		}
		_engine = this
	}

	engine: LiquidEx
	options: IOptions
	variables: IObjectLiteral
	expressionCache: IObjectLiteral
	global: any
	context: Context
	stats: any
	async render(sourceFile: string, vars: IObjectLiteral) {
		vars = {
			targetLanguage: this.options.targetLanguage || 'en',
			sourceLanguage: this.options.sourceLanguage || 'en',
			i18n: '${OSR_ROOT}/i18n-store/store-en.json',
			...this.options.profile.variables,
			...vars
		}
		let owner = this
		let _engine = this.engine
		_engine.owner = owner
		this.variables = vars
		const src = '' + sourceFile
		const resolveFs = (f) => resolve_path(f, false, vars)
		let options_: IOptions = {
			fs: defaultFS(resolveFs),
			...this.options,
			resolve: resolveFs
		}
		this.options = options_
		let source = read(sourceFile)
		let tmpFile = (sourceFile + '.tmp').replace('.md', '._md')
		tmpFile = (sourceFile + '.tmp').replace('.html', '._html')
		if (this.options.template && exists(this.options.template)) {
			const template = read(this.options.template, 'string')
			if (!template) {
				logger.error(`Invalid template file: ${this.options.template}`)
				return false
			}
			source = substitute(false, template as string, { SOURCE: source, ...this.variables })
			write(tmpFile, source)
			sourceFile = tmpFile
		}

		//@todo
		_engine.options['string'] = source
		registerDSTag(_engine)
		registerJS(_engine)
		registerI18n(_engine)
		registerOpenAI(_engine)
		registerPrint(_engine)
		registerMInclude(_engine)
		registerGET(_engine)
		let _fm: any = { fm: {} }
		try {
			if (fm.test(_engine.options['string'])) {
				_fm = {
					fm: fm(_engine.options['string']).attributes,
					body: fm(_engine.options['string']).body
				}
				vars.fm ? _fm.fm = { ...vars.fm, ..._fm.fm } : null
			}
		} catch (e) {
			logger.error(`Error parsing front matter: ${e.message} : ${sourceFile}`)
		}

		let parsed = await _engine.parseFile(sourceFile)
		_engine.registerFilter('jseval', async x => await runJS(x, options_, owner, parsed))
		_engine.registerFilter('jsexp', x => runJSExpressionEx(x, options_, _engine, parsed, _engine, {}, ""))
		_engine.registerFilter('i18n', async x => await i18n(x, options_, this, parsed, _engine, {}, ""))
		_engine.registerFilter('html', async x => await html(x, options_, this))
		_engine.registerFilter('turndown', async x => await markdown(x, options_, this))
		_engine.registerFilter('pretty', async x => await pretty(x, options_, this))
		_engine.registerFilter('openAI', async x => await openAI(x, options_ as any, this, parsed, _engine, {}, ""))

		let fmChanged = false
		if (Object.keys(_fm.fm) && Object.keys(_fm.fm).length > 0) {
			for (let k in _fm.fm) {
				if (k.endsWith('_i18n')) {
					const val = await i18n(_fm.fm[k], options_, this, parsed, _engine, {}, "")
					if (val) {
						_fm.fm[k] = val
						delete _fm.fm[k]
						_fm.fm[k.replace('_i18n', '')] = val
						fmChanged = true
					}
				}
			}
		}
		fmChanged = true
		if (fmChanged && _fm.fm && Object.keys(_fm.fm).length > 0) {
			source = '---\n' + stringify(_fm.fm) + '---\n' + _fm.body
			write(tmpFile, source)
			sourceFile = tmpFile
			options_['source'] = tmpFile
		}
		const childCtx = new LContext(
			{},
			this.options as any,
			{
				sync: false,
				globals: {
					..._fm.fm,
					...this.variables,
					fm: _fm.fm
				},
				strictVariables: false,
				ownPropertyOnly: false
			})


		let ret = null;
		debugger
		try {
			ret = await _engine.renderFile(sourceFile, childCtx, {
				globals: {
					..._fm.fm,
					...this.variables,
					fm: _fm.fm
				}
			})
		} catch (e) {
			logger.error(`Error rendering file: ${sourceFile} \n\t : ${e.message}`)
			rm(tmpFile)
			return false
		}

		rm(tmpFile)
		options_['source'] = src
		if (options_.format === 'html') {
			ret = html_beautify(md2html(ret))
		}
		if (options_.format === 'pretty') {
			ret = html_beautify(ret)
		}
		if(this.options.trace){
			const traceFile = resolveFs(this.options.trace)
			write(traceFile, { ...this.stats, ...this.options.profile })
		}		
		return ret
	}
	async parse(string: string, vars: any, iterations: number = 5) {
		let _engine = this.engine;
		_engine.options['string'] = string;
		let _fm = { fm: {} };
		if (fm.test(_engine.options['string'])) {
			_fm = {
				fm: fm(_engine.options['string']).attributes
			}
		}
		this.variables = {
			...vars,
			..._fm.fm
		};

		let owner = this;
		(_engine as any).owner = this;
		let options_ = {
			fs: {
				exists: (f) => {
					return exists(f)
				},
				existsSync: existsSync,
				readFile: (f) => readFile(path.resolve(resolve_path(f))),
				readFileSync: readFileSync,
				resolve
			},
			...this.options
		}

		registerDSTag(_engine);
		registerJS(_engine);
		registerMInclude(_engine);
		let parsed = _engine.parse(string);
		_engine.registerFilter('jseval', x => runJS(x, options_, owner, parsed))
		_engine.registerFilter('jsexp', x => runJSExpression(x, options_, owner, parsed))
		parsed = _engine.parse(string)
		let t = await _engine.render(parsed, vars, options_ as LiquidOptions)
		for (let i = 0; i < iterations; i++) {
			t = await this.engine.render(parsed, vars, options_ as LiquidOptions);
		}
		if (options_.format === 'html') {
			t = html_beautify(md2html(t))
		}
		return t
	}	
}
