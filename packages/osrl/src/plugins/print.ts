import { TagToken } from '../liquidjs/tokens/tag-token'
import { TopLevelToken } from '../liquidjs/tokens/toplevel-token'
import { TagImplOptions } from '../liquidjs/template/tag/tag-impl-options'
import { Liquid, Tokenizer } from '../liquidjs/liquid'

export const register = (engine: Liquid) => {
    engine.registerTag('print', {
        parse(tagToken, remainTokens) {
            this.tpls = []
            this.tokens = []
            let closed = false
            this['currentFile'] = tagToken.file
            while (remainTokens.length) {
                let token: any = remainTokens.shift()
                if (token.name === 'print-end') {
                    closed = true
                    break
                }
                let tpl = this.liquid.parser.parseToken(token, remainTokens)
                this.tpls.push(tpl)
                this.tokens.push(token)
            }
            if (!closed) throw new Error(`tag ${tagToken.getText()} not closed`)
        },
        * render(context, emitter) {
            let { liquid } = this
            const text = this.tpls.map((token) => {
                return token.str
            }).join('')
            const token = this.tokens[0] ? this.tokens[0] : null
            const t = token.getContent()
            if(token) {
                emitter.write(`\n${token.getText()}`)
            }
        }
    })
}