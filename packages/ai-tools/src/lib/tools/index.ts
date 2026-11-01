import { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction'
import { JSONSchema } from 'openai/lib/jsonschema'
import { ZodSchema, z } from 'zod'

// see https://github.com/openai/openai-node/blob/master/examples/tool-call-helpers-zod.ts
export const zodFunction =<T extends object>({
    function: fn,
    schema,
    description = '',
    name,
  }: {
    function: (args: T) => Promise<object>
    schema: ZodSchema<T>
    description?: string
    name?: string
  }): RunnableToolFunctionWithParse<T>  => {
    return {
      type: 'function',
      function: {
        function: fn,
        name: name ?? fn.name,
        description: description,
        parameters: z.toJSONSchema(schema) as JSONSchema,
        parse(input: string): T {
          const obj = JSON.parse(input)
          return schema.parse(obj)
        }
      }
    }
  }