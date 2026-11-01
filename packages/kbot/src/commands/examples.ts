import { marked } from 'marked'
import { examples as content } from '../docs-internal/examples.js'

export const examples = () => {  
  process.stdout.write(marked(content) as string)
}
