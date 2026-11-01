import * as fs from 'fs'
import { mkdirp, mkdirpSync } from 'mkdirp'
import * as  pathUtil from "path"
import { validateArgument } from './utils/validate.js'

const promisedSymlink = fs.promises.symlink

export function validateInput(methodName: string, symlinkValue: string, path: string) {
  const methodSignature = methodName + '(symlinkValue, path)';
  validateArgument(methodSignature, 'symlinkValue', symlinkValue, ['string']);
  validateArgument(methodSignature, 'path', path, ['string']);
};
// ---------------------------------------------------------
// Sync
// ---------------------------------------------------------

export function sync(symlinkValue: string, path: string): void {
  try {
    fs.symlinkSync(symlinkValue, path);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Parent directories don't exist. Just create them and rety.
      mkdirpSync(pathUtil.dirname(path));
      fs.symlinkSync(symlinkValue, path);
    } else {
      throw err;
    }
  }
}

// ---------------------------------------------------------
// Async
// ---------------------------------------------------------
export function async(symlinkValue: string, path: string):Promise<void> {
  return new Promise((resolve, reject) => {
    promisedSymlink(symlinkValue, path)
      .then(resolve)
      .catch((err: any) => {
        if (err.code === 'ENOENT') {
          // Parent directories don't exist. Just create them and rety.
          mkdirp(pathUtil.dirname(path))
            .then(() => { return promisedSymlink(symlinkValue, path); })
            .then(resolve, reject);
        } else {
          reject(err);
        }
      });
  });
}
