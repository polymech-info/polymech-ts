import * as path from 'path'
import { Engine } from '../index'
import { createHash } from 'crypto'
import { sync as read } from '@plastichub/fs/read'
import { sync as write } from '@plastichub/fs/write'

const removeNonPrintableCharacters = (text: string): string => text.replace(/[^\x20-\x7E]/g, '')

export const clean = (text: string = "") => text.trim()
export const hash = (text: string) => createHash('md5').update(clean(text)).digest('base64')

export const store = (storePath:string, text: string, file: string = '') => {
	const _hash: string = hash(text)
	const store = read(storePath, 'json') || {}
	store[_hash] = clean(text)
	write(storePath, store)
}
