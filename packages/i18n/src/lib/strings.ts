import { createHash } from 'crypto'
export const clean = (text: string = "") => text.trim()
export const hash = (text: string) => createHash('md5').update(clean(text)).digest('base64')