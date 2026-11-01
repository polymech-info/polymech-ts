import * as path from 'path'
import { Engine, logger } from '../index'
import { clean } from '../lib/i18n'
import { Liquid, Template } from '../liquidjs/liquid'
import { translateText, storeGet, storeSet } from '@plastichub/osr-i18n/lib/translate'
import { resolve } from '@plastichub/osr-commons'
import { IOptions } from '../types'
import { Tokenizer, Hash, Emitter } from '../liquidjs/liquid'
import { CONFIG_DEFAULT } from '@plastichub/osr-commons'

import { prompt, applyFilters, Filter } from '@plastichub/osr-ai/lib/openai'

const openAI = false

const translateOpenAI = async (text: string, srcLang: string, dstLang: string, store: string, engine: Engine) => {

	const query = `translate from ${srcLang} to ${dstLang}: ${text}`
	const config = CONFIG_DEFAULT() as any
	const _store = path.resolve(resolve(engine.variables['i18n'], false, engine.variables))
	const cached = storeGet(_store, text)
	if (cached) {
		return cached
	}

	const options: any = {
		query,
		api_key: process.env.OPENAI_API_KEY || config.openai.key,
		filters: '',
		logLevel: engine.options.logLevel || 'debug',
		gui: false,
		variables: { ...engine.variables },
	}

	let ret = await prompt(options)
	if (ret) {
		ret = applyFilters(ret, options.filters as Filter[] || [])
		storeSet(_store, text, ret)
	}

	return ret
}

export const onError = async (status: number, text: string, engine: Engine, sourceLanguage: string, targetLanguage: string, store: string) => {
	if (!openAI) {
		return text
	}

	if (status !== 403) {
		return text
	}
	return await translateOpenAI(text, sourceLanguage, targetLanguage, store, engine)
	return text
}

export const i18n = async (
	expr: string,
	options: IOptions,
	engine: Engine,
	parsed: Template[] = [],
	_ctx,
	args: any = {},
	templateFile: string = ""
) => {

	if (!engine.variables['i18n']) {
		logger.warn(`i18n : i18n is not defined in the variables`)
		return expr
	}
	const store = path.resolve(resolve(engine.variables['i18n'], false, engine.variables))
	if (!store) {
		logger.error(`i18n : i18n store not found`)
		return expr
	}
	const srcLang = engine.variables['sourceLanguage']
	const dstLang = engine.variables['targetLanguage']
	if (!srcLang || !dstLang || (srcLang === dstLang)) {
		return expr
	}
	let translation
	try {
		if(expr === 'Injectors') {
			//debugger
		}
		translation = await translateText(expr, srcLang, dstLang, { store })
	} catch (e) {
		logger.error(`Error translating text ${e.message} @ ${templateFile} : ${expr}`)
	}
	return translation || expr
}

export const register = (engine: Liquid) => {
	engine.registerTag('i18n', {
		parse(tagToken, remainTokens) {
			this.tpls = []
			const args = tagToken.args
			let closed = false
			this['currentFile'] = tagToken.file
			const tokenizer = new Tokenizer(args, this.liquid.options.operatorsTrie)
			const begin = tokenizer.p;
			while (remainTokens.length) {
				let token: any = remainTokens.shift()
				if (token.name === 'i18n-end') {
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
			let translation

			let output = ''
			const emitter2: Emitter = {
				buffer: emitter.buffer,
				write: function (html) {
					this.buffer += html
					output += html
				}
			}

			yield liquid.renderer.renderTemplates(this.tpls, context, emitter2)
			let text = output
			const owner: any = (this.liquid as any).owner
			const variables: any = owner.variables
			if (!owner.variables['i18n']) {
				logger.warn(`i18n tag used in ${this['currentFile']} but i18n is not defined in the variables`)
				return text
			}
			if (text &&
				text.length &&
				clean(text).length &&
				variables['i18n'] &&
				variables['sourceLanguage'] &&
				variables['targetLanguage']) {
				const store = path.resolve(resolve(owner.variables['i18n'], false, variables))
				const srcLang = variables['sourceLanguage']
				const dstLang = variables['targetLanguage']
				try {
					translation = yield translateText(text, srcLang, dstLang, {
						store
					})
				} catch (e) {
					logger.error(`Error translating \n\t${text} \n in ${this['currentFile']}: ${e.message} : ${e.response.data.message}`)
					/*
					translation = yield onError(e.response.status, text, owner, srcLang, dstLang, store)
					if (translation) {
						// storeSet(text, translation, srcLang, dstLang, store)
						logger.info(`Translated via OpenAI`)
						//debugger
						return translation
					}
					*/
				}
			} else {
				logger.warn(`Invalid parameters for i18n tag in ${this['currentFile']}`)
			}
			//yield liquid.renderer.renderTemplates(this.tpls, context, emitter)
			return translation || text
		}
	})
}