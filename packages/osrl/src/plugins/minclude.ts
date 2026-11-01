import * as path from 'path'
import { assert, Tokenizer, evalToken, Hash, Emitter, TagToken, Context } from '../liquidjs/liquid'
import { arg } from './'
import { parseFilePath, renderFilePath } from '../liquidjs/builtin/tags/render'
import BlockMode from '../liquidjs/context/block-mode'
import { applyFilters, Filters } from '../filters'
import { isString } from '../liquid/underscore'
import { forward_slash } from '@plastichub/osr-commons'

export const register = (engine) => {
  engine.registerTag('include', {
    parseFilePath,
    renderFilePath,
    parse: function (token: TagToken) {
      const args = token.args
      const tokenizer = new Tokenizer(args, this.liquid.options.operatorsTrie)
      this['file'] = this.parseFilePath(tokenizer, this.liquid)
      this['currentFile'] = token.file
      const begin = tokenizer.p
      const withStr = tokenizer.readIdentifier()
      if (withStr.content === 'with') {
        tokenizer.skipBlank()
        if (tokenizer.peek() !== ':') {
          this.withVar = tokenizer.readValue()
        } else tokenizer.p = begin
      } else tokenizer.p = begin

      this.hash = new Hash(tokenizer.remaining(), this.liquid.options.jekyllInclude)
    },
    render: function* (ctx: Context, emitter: Emitter) {
      const enabled = yield* arg(this.hash.hash, 'enabled', ctx, true)
      if (!enabled) return
      const { liquid, hash, withVar } = this
      const { renderer } = liquid
      let filepath = yield this.renderFilePath(this['file'], ctx, liquid)
      if (isString(filepath)) {
        filepath = liquid.owner.options.resolve(filepath)
      }
      assert(filepath, () => `illegal filename "${filepath}"`)
      const assign = yield* arg(this.hash.hash, 'assign', ctx)
      //const before = yield* arg(this.hash.hash, 'before', ctx)
      const after = yield* arg(this.hash.hash, 'after', ctx)
      const saved = ctx.saveRegister('blocks', 'blockMode')
      ctx.setRegister('blocks', {})
      ctx.setRegister('blockMode', BlockMode.OUTPUT)
      const scope = yield hash.render(ctx)
      if (withVar) scope[filepath] = evalToken(withVar, ctx)
      const templates = yield liquid._parsePartialFile(filepath, ctx.sync, this['currentFile'])
      ctx.push(ctx.opts.jekyllInclude ? { include: scope } : scope)
      let output = ''
      const emitter2: Emitter = {
        buffer: emitter.buffer,
        write: function (html) {
          this.buffer += html
          output += html
        }
      }
      yield renderer.renderTemplates(templates, ctx, emitter2)
      ctx.pop()
      ctx.restoreRegister(saved)
      const rel = path.relative(liquid.owner.options.cwd,this.currentFile).replace('.tmp','')
      liquid.owner.stats.imports.push({ file: filepath, parent: forward_slash(rel) })
      output = yield applyFilters(output, after || '', Filters(liquid.owner.options))
      if (assign) {
        ctx.bottom()[assign] = output
        return
      }
      return output
    }
  })
}
