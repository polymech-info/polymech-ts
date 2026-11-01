import * as path from 'node:path'
import { pathInfoEx } from '@polymech/commons'
import { DEFAULT_ROOTS, DEFAULT_VARS } from '@polymech/commons'
import { IKBotTask } from './ai-tools/index.js'
import { sync as exists } from '@polymech/fs/exists'

export const sourceVariables = (filePath: string, projectPath: string): Record<string, string> => {
  const fileSpecificVariables: Record<string, string> = {};
  const srcParts = path.parse(filePath);

  fileSpecificVariables.SRC_NAME = srcParts.name;
  fileSpecificVariables.SRC_DIR = srcParts.dir;
  fileSpecificVariables.SRC_EXT = srcParts.ext.startsWith('.') ? srcParts.ext.substring(1) : srcParts.ext; // Remove leading dot from ext
  fileSpecificVariables.SRC_BASENAME = srcParts.base;
  fileSpecificVariables.SRC_PATH = filePath;

  // Calculate SRC_REL relative to projectPath for the file's directory
  if (projectPath && path.isAbsolute(srcParts.dir) && path.isAbsolute(projectPath)) {
    fileSpecificVariables.SRC_REL = path.relative(projectPath, srcParts.dir);
  } else {
    // If paths are not suitable for relative calculation (e.g., one is not absolute)
    // or projectPath is not provided, SRC_REL might be less meaningful or empty.
    fileSpecificVariables.SRC_REL = ''; 
  }

  const addIndexedParts = (baseKey: string, fullName: string, delimiter: string) => {
    const parts = fullName.split(delimiter);
    if (parts.length > 1) {
      parts.forEach((part, i) => {
        fileSpecificVariables[`${baseKey}${i}`] = part;
      });
    }
  };
  addIndexedParts('SRC_NAME-', srcParts.name, '-');
  addIndexedParts('SRC_NAME.', srcParts.name, '.');
  addIndexedParts('SRC_NAME_', srcParts.name, '_');  
  // Convert all keys to uppercase
  const uppercasedVariables: Record<string, string> = {};
  for (const key in fileSpecificVariables) {
    uppercasedVariables[key.toUpperCase()] = fileSpecificVariables[key];
  }

  return uppercasedVariables;
};

export const variables = (options: IKBotTask) => {    
    const { model, router,baseURL } = options    
    let ret = {
        model,
        router,
        baseURL,
        ...DEFAULT_ROOTS,
        ...DEFAULT_VARS({})
    }
    
    let sourcePath: string | undefined;
    if (options.include && options.include[0]) {
        sourcePath = options.include[0];
    } else if (options.prompt && options.prompt.length < 4096 && exists(options.prompt)) {
        sourcePath = options.prompt;
    }

    if (sourcePath) {
        const include = sourcePath
        const { } = pathInfoEx(include)
        const srcParts = path.parse(include)
        const srcVariables: Record<string, string> = {}
        srcVariables.SRC_NAME = srcParts.name
        srcVariables.SRC_DIR = srcParts.dir
        srcVariables.SRC_EXT = srcParts.ext
        if (ret.ROOT) {
            srcVariables.SRC_REL = path.relative(ret.ROOT, srcParts.dir)
        }

        const dashed = srcParts.name.split('-')
        if (dashed.length > 1) {
            for (let i = 0; i < dashed.length; i++) {
                srcVariables[`SRC_NAME-${i}`] = dashed[i]
            }
        }
        const dotted = srcParts.name.split('.')
        if (dotted.length > 1) {
            for (let i = 0; i < dotted.length; i++) {
                srcVariables[`SRC_NAME.${i}`] = dotted[i]
            }
        }

        const underscored = srcParts.name.split('_')
        if (underscored.length > 1) {
            for (let i = 0; i < underscored.length; i++) {
                srcVariables[`SRC_NAME_${i}`] = underscored[i]
            }
        }
        ret = { ...ret, ...srcVariables }
    }

    // CLI argv variables
    let variables = Object.assign({}, ...Object.keys(options).filter((k) => k.startsWith('var-')).map((k) => {
        return {
            [k.replace('var-', '')]: options[k]
        }
    }))
    ret = Object.keys(ret).reduce((acc, key) => {
        acc[key.toUpperCase()] = ret[key];
        return acc;
    }, {});
    
    return { ...ret, ...variables }
}