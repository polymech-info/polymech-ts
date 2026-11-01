import * as fs from 'node:fs'
import { sync as writeSync, async as writeASync } from './write.js'

import { validateArgument, validateOptions } from './utils/validate.js'
export interface Options {
  mode: string;
  encoding?: string;
  flag?: string;
}
export const validateInput = (methodName: string, path: string, data: any, options?: Options) => {
  const methodSignature = methodName + '(path, data, [options])';
  validateArgument(methodSignature, 'path', path, ['string']);
  validateArgument(methodSignature, 'data', data, ['string', 'buffer']);
  validateOptions(methodSignature, 'options', options, {
    mode: ['string', 'number']
  });
};
// ---------------------------------------------------------
// SYNC
// ---------------------------------------------------------
export const sync = (path: string, data: any, options: Options): void => {
  try {
    fs.appendFileSync(path, data, options ? { encoding: options.encoding as BufferEncoding, mode: options.mode as string } : {});
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Parent directory doesn't exist, so just pass the task to `write`,
      // which will create the folder and file.
      writeSync(path, data, options);
    } else {
      throw err;
    }
  }
};

export const async = (path: string, data: string | Uint8Array, options?: Options): Promise<void> => {
  return fs.promises.appendFile(path, data, options as any)
};
