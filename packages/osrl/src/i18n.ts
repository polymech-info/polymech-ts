
import {
	I18N_SOURCE_LANGUAGE, I18N_STORE,
	OSR_ROOT
} from './config'

import { IOptions as IOptionsI18n } from '@plastichub/osr-i18n/types'

import { CONFIG_DEFAULT } from '@plastichub/osr-commons'

import { translateDeepL, getTranslation, translate } from '@plastichub/osr-i18n/lib/translate'
import { sync as read } from '@plastichub/fs/read'
import { sync as write } from '@plastichub/fs/write'

import { sanitize } from '@plastichub/osr-i18n/_cli'

import { createHash } from 'crypto'

const removeNonPrintableCharacters = (text: string): string => text.replace(/[^\x20-\x7E]/g, '')

export const clean = (text: string = "") => text.trim()
export const hash = (text: string) => createHash('md5').update(clean(text)).digest('base64')

export const store = (storePath: string, text: string, file: string = '') => {
	const _hash: string = hash(text)
	const store = read(storePath, 'json') || {}
	store[_hash] = clean(text)
	write(storePath, store)
}

export const translateText = async (text: string, srcLang: string, dstLang: string, storePath: string) => {
	if (text.length === 0) {
		return ''
	}
	if (srcLang === dstLang) {
		store(storePath, text)
		return
	}
	const config: any = CONFIG_DEFAULT()
	text = clean(text)
	const _hash: string = hash(text)
	const db = read(storePath, 'json') || {}
	if (db[text]) {
		return db[text]
	}
	const out = await translateDeepL(
		text,
		srcLang,
		dstLang,
		{
			...config.deepl
		}, {

	}, "")

	const translation = getTranslation((out as any), false)

	if (translation) {
		db[text] = translation
		write(storePath, db)
		return translation
	}
}

export const translateString = (str: string, srcLang: string, dstLanguage: string) => {

	const translateProductAssets = async () => {
		const config: any = CONFIG_DEFAULT()
		if (dstLanguage === I18N_SOURCE_LANGUAGE) {
			return
		}
		const i18nOptions: IOptionsI18n = {
			srcLang: I18N_SOURCE_LANGUAGE,
			dstLang: dstLanguage,
			store: I18N_STORE(OSR_ROOT(), dstLanguage),
			noCache: true,
			api_key: config.deepl.auth_key,
			logLevel: 'warn'
		}
		const ret = await translate(sanitize(i18nOptions) as any)
		return ret
	}
}
