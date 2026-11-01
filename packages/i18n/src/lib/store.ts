import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/read'
import { resolve } from '@polymech/commons'
import * as path from 'path'

const removeNonPrintableCharacters = (text: string): string => text.replace(/[^\x20-\x7E]/g, '')

const clean = (text: string = "") => text.trim()

export const sortObjectKeysAlpha = (obj: Record<string, any>): Record<string, any> => {
	const sortedKeys = Object.keys(obj).sort();
	const sortedObj: Record<string, any> = {};
	sortedKeys.forEach((key) => {
		sortedObj[key] = obj[key];
	});
	return sortedObj;
};

export const store = (storePath:string, text: string, translation:string, options:any = {}) => {
	if (storePath && options && options.store) {
        storePath = path.resolve(resolve(options.store, options.alt, {
            DST_LANG: options.dstLang
        }))
    }    
	const store:any = read(storePath, 'json') || {}
	store[text] = clean(translation)
	write(storePath, sortObjectKeysAlpha(store))
	return translation
}

export const get = (storePath:string, text: string, options:any = {}) => {
	if (storePath && options && options.store) {
        storePath = path.resolve(resolve(options.store, options.alt, {
            DST_LANG: options.dstLang
        }))
    }
	const store = read(storePath, 'json') || {}
	if(store[text]){
		return store[text]
	}
}