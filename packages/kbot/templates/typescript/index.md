# Typescript Defaults

## Filesystem

For filesystem operations, use

import { sync as rm } from '@plastichub/fs/remove' (path)
import { sync as dir } from '@plastichub/fs/dir' (path)
import { sync as write } from '@plastichub/fs/write' (path, content)
import { sync as read } from '@plastichub/fs/read' (path)
import { filesEx as glob } from '@plastichub/osr-commons/_glob' (directory,glob | glob[])

## Configuration

API keys and other settings:

```ts
import { CONFIG_DEFAULT } from '@plastichub/osr-commons'
export const foo = (yarg) => {
    const config = CONFIG_DEFAULT(args.env_key) as any
    if (!config) {
        logger.warn('No config found!')
        return
    }
    if (config && !config.openai.key) {
        logger.warn('No OpenAI  key found in config!')
        return
    }
    const api_key =  argv.openai_key || process.env.OPENAI_API_KEY || config.openai.key
}
```

### Logging

Each package has a tslog factory at src/index.ts. Use it for all commands and library functions

```ts
export { Logger } from 'tslog'
import { createLogger } from '@plastichub/osr-log'
import { Logger } from 'tslog'
export const logger:Logger<unknown> = createLogger('Package Name')
```

### LLM Tools

LLM Tools are specified as follows

- always export "tools" as the main function
- dont register LLM tools as yarg commands
- seperate the tool's implementation in src/lib/tools
- LLM tools require 'openai' as dependency

eg: src/tools/fs:

```ts
import { join } from 'path'
import * as path from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'
import { isString } from '@plastichub/core/primitives'
import { sync as dir } from '@plastichub/fs/dir'
import { sync as write } from '@plastichub/fs/write'
import { resolve } from "@plastichub/osr-commons"
import { logger } from '../'

export const tools = (target:any, variables:Record<string,string>={}): Array<any> => {
    return [
        {
            type: 'function',
            function: {
                name: "read_file",
                description: "read a file, at given a path",
                parameters: {
                    type: "object",
                    properties: {
                        file: {
                            type: "object",
                            properties: {
                                path: { type: "string" }
                            }
                        }
                    },
                    required: ["file"],
                },
                function: async (ret) => {
                    try {
                        const { file } = ret as any
                        const filePath = path.resolve(resolve(join(target, file.path),false,variables))
                        logger.debug(`Tool::ReadFile Reading file ${filePath}`)
                    } catch (error) {
                        logger.error(`Error reading file`, error)
                    }                    
                },
                parse:  JSON.parse
            }
        } as RunnableToolFunction<{ id: string }>
    ]
}
```

### Typescript tsconfig

Use this defaults

```json
"compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowJs": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "forceConsistentCasingInFileNames": true
  },
```

### Yargs

Commands are registered as follows (src/command/index.ts) :

```ts
import type { Argv } from 'yargs'
import { types } from './types'
export const commands = (yargs: Argv) => 
{
  return yargs
    .command('types', 'Generate TypeScript interfaces from Zod schemas', {}, types)
    .strict()
    .help()
}
```

Use toYargs to convert Zod schemas to Yargs as follows

```ts

import { toYargs } from '@plastichub/osr-commons'
import { MySchema } from 'src/schemas.ts'
// example :  const options = (yargs: CLI.Argv) => toYargs(yargs, MySchema())
```

### Nodejs

- import built-ins always as import * as 'node:path', 'node:fs' (Deno)
- avoid React, ora, tsx, ts-node
