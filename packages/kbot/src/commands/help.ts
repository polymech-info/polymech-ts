import { z } from 'zod'
import { marked } from 'marked'
import { getDefaultValue, getDescription } from '@polymech/commons'

import { OptionsSchema } from '../zod_schema.js'

export const help = () => {
  const schema = OptionsSchema()
  const desc = schema._def.description
  const shape = schema.shape

  const md = [
    '# KBot Command Line Interface',
    '',
    '```bash',
    'kplus modify [prompt] [options]',
    '```',
    '',
    '## Description',
    '',
    desc || 'KBot CLI Tool',
    '',
    '## Options',
    ''
  ]

  // Process each parameter
  for (const [key, def] of Object.entries(shape)) {
    const isOptional = def instanceof z.ZodOptional    
    const defaultValue = getDefaultValue(def as any)
    const description = getDescription(def as any)
    md.push(`--${key}`)
    md.push('')
    md.push(`Description: ${description}`)
    if (defaultValue !== undefined) {
      md.push(`Default: \`${JSON.stringify(defaultValue)}\``)
    }
    md.push(`Required: ${(!isOptional).toString()}`)
    md.push('')
  }

  const content: string = marked(md.join('\n')) as string;
  process.stdout.write(content)
  return content
}

export default async (argv: any) => {
  return help()
}
