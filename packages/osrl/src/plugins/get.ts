import axios from 'axios'
import { JSONPath } from 'jsonpath-plus'
import { isString, isObject, isArray } from '@plastichub/core/primitives'

import { logger } from '../index'

import { assert, Tokenizer, Hash, Emitter, TagToken, Context } from '../liquidjs/liquid'
import { arg } from './'
import { parseFilePath, renderFilePath } from '../liquidjs/builtin/tags/render'
import { applyFilters, cleanArray, Filters, isValidUrl } from '../filters'


export const register = (engine) => {
  engine.registerTag('get', {
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

      let url = yield this.renderFilePath(this['file'], ctx, liquid)
      if (isString(url)) {
        url = liquid.owner.options.resolve(url)
      }
      assert(url, () => `illegal url "${url}"`)
      assert(isValidUrl(url), () => `illegal url "${url}"`)

      let data = null
      const raw = yield axios.get(url)
      if (!raw) {
        logger.error(`Error fetching data from ${url}`)
        return
      }

      if (raw && raw.data) {
        data = raw.data
      }

      const jsonpath = yield* arg(this.hash.hash, 'path', ctx)
      if (jsonpath && (isObject(data) || isArray(data))) {
        try {
          data = JSONPath(
            {
              path: jsonpath,
              json: data,

            })
          data = cleanArray(data)          
          //@todo : jsonpath spec
          if (isArray(data) && data.length === 1) {
            data = data[0]
          }
        } catch (error) {
          logger.error('Error querying index', error, error.stack)
        }
      }
      const assign = yield* arg(this.hash.hash, 'assign', ctx)
      const before = yield* arg(this.hash.hash, 'before', ctx)
      const after = yield* arg(this.hash.hash, 'after', ctx)
/*
      @todo : remote content
      ctx.setRegister('blocks', {})
      ctx.setRegister('blockMode', BlockMode.OUTPUT)

      const scope = yield hash.render(ctx)
      if (withVar) scope[url] = evalToken(withVar, ctx)

      const templates = yield liquid._parsePartialFile(url, ctx.sync, this['currentFile'])
      ctx.push(ctx.opts.jekyllInclude ? { include: scope } : scope)
      let output = ''
      const collector: Emitter = {
        buffer: emitter.buffer,
        write: function (html) {
          this.buffer += html
          output += html
        }
      }
      yield renderer.renderTemplates(templates, ctx, collector)
      ctx.pop()
      ctx.restoreRegister(saved)
      liquid.owner.stats.includes.push({ file: url, parent: this.currentFile })
      */
      data = yield applyFilters(data, after || '', Filters(liquid.owner.options))
      if (assign) {
        ctx.bottom()[assign] = data
        return
      }
      return data
    }
  })
}
