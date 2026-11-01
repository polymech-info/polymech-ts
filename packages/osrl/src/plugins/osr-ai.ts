import * as path from 'path'

import { CONFIG_DEFAULT } from '@plastichub/osr-commons'
import { sync as read } from '@plastichub/fs/read'
import { sync as write } from '@plastichub/fs/write'
import { sync as exists } from '@plastichub/fs/exists'

import { Engine, logger } from '../index'
import { arg } from './'
import { Liquid, Template, Tokenizer, Hash, Emitter } from '../liquidjs/liquid'
import { prompt, IOptions, IOptionsEx, applyFilters, Filter } from '@plastichub/osr-ai/lib/openai'

export const openAI = async (
	expr: string,
	options: IOptions,
	engine: Engine,
	parsed: Template[] = [],
	_ctx,
	args: any = {},
	templateFile: string = ""
) => {
	return expr
}

const aiArgs = ['assign', 'dst', 'source', 'model', 'cache', 'filters', 'logLevel', 'system', 'gui']

export const removeFields = (obj: Record<string, any>, fields: string[]): Record<string, any> => {
	const newObj = { ...obj }
	fields.forEach(field => delete newObj[field])
	return newObj
}

export const register = (engine: Liquid) => {
	engine.registerTag('osr-ai', {
		parse(tagToken, remainTokens) {
			this.tpls = []
			const args = tagToken.args
			let closed = false
			this['currentFile'] = tagToken.file
			const tokenizer = new Tokenizer(args, this.liquid.options.operatorsTrie)
			const begin = tokenizer.p;
			while (remainTokens.length) {
				let token: any = remainTokens.shift()
				if (token.name === 'osr-ai-end') {
					closed = true
					break
				}
				let tpl = this.liquid.parser.parseToken(token, remainTokens)
				this.tpls.push(tpl)
			}
			if (!closed) throw new Error(`tag ${tagToken.getText()} not closed`)
			tokenizer.p = begin;
			this.hash = new Hash(tokenizer.remaining());
		},
		* render(context, emitter) {
			let { liquid } = this
			let query = this.tpls.map((token) => token.str).join('').trim()
			const config = CONFIG_DEFAULT() as any

			let output = ''
			const collector: Emitter = {
				buffer: emitter.buffer,
				write: function (html) {
					this.buffer += html
					output += html
				}
			}
			
			const hash = this.hash.hash
			let vars = Object.fromEntries(
				yield Promise.all(
					Object.keys(hash).map(async key => [key, yield* arg(hash, key, context)])
				)
			)
			Object.keys(vars).forEach(key => {
				context.bottom()[key] = vars[key]
			})
			query = yield liquid.renderer.renderTemplates(this.tpls, context, collector)

			const owner: Engine = (this.liquid as any).owner
			const resolve = owner.options.resolve

			const assign = yield* arg(hash, 'assign', context)
			let dst = yield* arg(hash, 'dst', context)
			let source = yield* arg(hash, 'source', context)
			if (dst) {
				dst = path.resolve(resolve(dst))
			}
			if (source) {
				source = path.resolve(resolve(source))
			}

			const options: IOptionsEx = {
				model: yield* arg(hash, 'model', context),
				cache: yield* arg(hash, 'cache', context),
				query: output,
				api_key: process.env.OPENAI_API_KEY || config.openai.key,
				filters: yield* arg(hash, 'filters', context),
				logLevel: yield* arg(hash, 'logLevel', context),
				gui: yield* arg(hash, 'gui', context),
				dst: dst,
				source: source,
				variables: { ...owner.variables, ...removeFields(vars, aiArgs) },
				system: yield* arg(hash, 'system', context)
			}

			if (options.cache && dst && exists(options.dst)) {
				logger.debug('Output file already exists, skipping: ', options.dst)
				return read(options.dst) as string
			}

			let ret = yield prompt(options)
			const result = applyFilters(ret, options.filters as Filter[] || [])
			logger.debug(`osr-ai: render prompt ${query} : \`t\n${result}\``)

			if (options.dst) {
				write(options.dst, result)
			}

			if (assign) {
				context.bottom()[assign] = result;
				liquid['owner'].variables[assign] = result
				return
			}
			return result
		}
	})
}

// custom ai filters

export const registerFilter = (engine: Liquid) => {
	engine.registerTag('osr-ai-filter', {
		parse(tagToken, remainTokens) {
			this.tpls = []
			const args = tagToken.args
			let closed = false
			this['currentFile'] = tagToken.file
			const tokenizer = new Tokenizer(args, this.liquid.options.operatorsTrie)
			const begin = tokenizer.p;
			while (remainTokens.length) {
				let token: any = remainTokens.shift()
				if (token.name === 'osr-ai-filter-end') {
					closed = true
					break
				}
				let tpl = this.liquid.parser.parseToken(token, remainTokens)
				this.tpls.push(tpl)
			}
			if (!closed) throw new Error(`tag ${tagToken.getText()} not closed`)
			tokenizer.p = begin;
			this.hash = new Hash(tokenizer.remaining());
		},
		* render(context, emitter) {
			let { liquid } = this
			let query = this.tpls.map((token) => token.str).join('').trim()
			const config = CONFIG_DEFAULT() as any

			let output = ''
			const collector: Emitter = {
				buffer: emitter.buffer,
				write: function (html) {
					this.buffer += html
					output += html
				}
			}
			
			const hash = this.hash.hash
			let vars = Object.fromEntries(
				yield Promise.all(
					Object.keys(hash).map(async key => [key, yield* arg(hash, key, context)])
				)
			)
			Object.keys(vars).forEach(key => {
				context.bottom()[key] = vars[key]
			})
			query = yield liquid.renderer.renderTemplates(this.tpls, context, collector)

			const owner: Engine = (this.liquid as any).owner
			const resolve = owner.options.resolve

			const assign = yield* arg(hash, 'assign', context)
			let dst = yield* arg(hash, 'dst', context)
			let source = yield* arg(hash, 'source', context)
			if (dst) {
				dst = path.resolve(resolve(dst))
			}
			if (source) {
				source = path.resolve(resolve(source))
			}

			const options: IOptionsEx = {
				model: yield* arg(hash, 'model', context),
				cache: yield* arg(hash, 'cache', context),
				query: output,
				api_key: process.env.OPENAI_API_KEY || config.openai.key,
				filters: yield* arg(hash, 'filters', context),
				logLevel: yield* arg(hash, 'logLevel', context),
				gui: yield* arg(hash, 'gui', context),
				dst: dst,
				source: source,
				variables: { ...owner.variables, ...removeFields(vars, aiArgs) },
				system: yield* arg(hash, 'system', context)
			}

			if (options.cache && dst && exists(options.dst)) {
				logger.debug('Output file already exists, skipping: ', options.dst)
				return read(options.dst) as string
			}

			let ret = yield prompt(options)
			const result = applyFilters(ret, options.filters as Filter[] || [])
			logger.debug(`osr-ai: render prompt ${query} : \`t\n${result}\``)

			if (options.dst) {
				write(options.dst, result)
			}

			if (assign) {
				context.bottom()[assign] = result;
				liquid['owner'].variables[assign] = result
				return
			}
			return result
		}
	})
}