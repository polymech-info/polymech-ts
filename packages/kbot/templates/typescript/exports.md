# Typescript API exports

## Code has to function as

- Yargs command
- API (using Hono and Zod to Open-API)
- LLM Tool (Zod to JSON schema)
- Library (Zod to Typescript typings)

## Supported platforms & environments

- NEXE (all in one excecutable)
- Electron
- Browser (VSCode for the web, eg: *code-server* )
- CI
- VSCode extension

## Support different run-times

- NodeJS
- Deno (default)

## Strategy

- implement the bare minimum in src/lib, preferably as pure functions
- each environment's specifics have to be implemented as extra layer
- avoid classes, decorators and any other Typescript only concepts, easing the transition to Rust and other languages
- if applicable, use maximum 2 arguments, otherwise use 'options' object (state)

## Zod Schema Specifics

Zod schemas are used to generate Typescript interfaces and Yarg options on demand

```ts
import { generate_interfaces } from '@plastichub/osr-commons'
import { MySchema } from 'src/schemas'
export const types = () => generate_interfaces(
    [
        MySchema()
    ], 'src/zod_types.ts')
```
