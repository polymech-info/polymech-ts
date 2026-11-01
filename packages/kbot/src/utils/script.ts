import * as path from 'node:path'
import { sync as write } from '@polymech/fs/write'
import { resolve } from '@polymech/commons'
import { IKBotOptions } from '../zod_types.js'

export const dumpAsScript = async (opts: IKBotOptions) => {
  if (!opts.dump) {
    return
  }
  const args = process.argv.slice(2).filter(a => !a.includes('--dump'))
  const scriptPath = path.resolve(resolve(opts.dump, false, {}))
  // Quote all parameter values
  const quotedArgs = args.map(arg => {
    if (arg.includes('=')) {
      const [key, ...values] = arg.split('=')
      const value = values.join('=')
      return `${key}="${value}"`
    }
    return arg
  })
  const script = `kbot ${quotedArgs.join(' ')}`
  write(scriptPath, script)
}