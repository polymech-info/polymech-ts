import * as path from 'path'
import Keyv from 'keyv'
import KeyvSqlite from '@keyv/sqlite'

import { resolve } from '@polymech/commons'

export const store = (storePath: string, ns: string = 'ns-unknown', opts: any = {}) => {
    const keyvSqlite = new KeyvSqlite(path.resolve(resolve(storePath)))
    return new Keyv({ store: keyvSqlite, ttl: 5000, namespace: ns, ...opts })
}
export const get = async (key: string, storePath: string, ns: string = 'ns-unknown', opts: any = {}) => {
    const keyv = store(storePath, ns, opts)
    return await keyv.get(key)
}
export const set = async (key: string, value: any, storePath: string, ns: string = 'ns-unknown', opts: any = {}) => {
    const keyv = store(storePath, ns, opts)
    return await keyv.set(key, value)
}
export const list = async (key: string, value: any, storePath: string, ns: string = 'ns-unknown', opts: any = {}) => {
    const keyv = store(storePath, ns, opts)
    return await keyv.set(key, value)
}
