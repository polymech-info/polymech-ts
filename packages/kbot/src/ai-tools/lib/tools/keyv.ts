import * as path from 'path'
import Keyv from 'keyv'
import { KeyvFile } from 'keyv-file'

import { resolve } from '@polymech/commons'

export const store = (storePath: string, ns: string = 'ns-unknown', opts: any = {}) => {
    const keyvFile = new KeyvFile({
        filename: path.resolve(resolve(storePath)),
        writeDelay: 100, // ms
    })
    return new Keyv({ store: keyvFile, namespace: ns, ...opts })
}
export const get = async (key: string, storePath: string, ns: string = 'ns-unknown', opts: any = {}) => {
    const keyv = store(storePath, ns, opts)
    return await keyv.get(key)
}
export const set = async (key: string, value: any, storePath: string, ns: string = 'ns-unknown', opts: any = {}) => {
    const keyv = store(storePath, ns, opts)
    return await keyv.set(key, value)
}
