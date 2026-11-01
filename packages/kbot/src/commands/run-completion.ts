import OpenAI from 'openai'
import { marked } from 'marked'
import * as path from 'node:path'
import { resolve } from '@polymech/commons'
import { IKBotTask } from '../ai-tools/index.js'

import { dumpAsScript } from '../utils/script.js'
import { applyFilters, Filter } from '../filters.js'
import { variables } from '../variables.js'
import { writeOrAppend } from '../utils/merge.js'
import { E_AppendModeType } from '../zod_schema.js'

export const onCompletion = async (result: any = "", options: IKBotTask) => {
  result = applyFilters(result, options.filters as Filter[] || [])
  let vars = variables(options)
  if (options.dst) {
    vars = {
      ...vars,
      MODEL: options.model ? path.parse(options.model).name : 'unknown_model',
      ROUTER: options.router || 'unknown_router',
    }
    const dstPath = path.resolve(resolve(options.dst, options.alt, vars))
    writeOrAppend(dstPath, result, options.append as E_AppendModeType)
    const action = options.append ? `${options.append} content to` : 'Wrote completion result to'
    options.logger?.debug(`${action} ${dstPath} : ${options.dst}`)
  } else if (!options.silent) {
    const content: string = marked(result) as string;
    process.stdout.write(content)
  }
  dumpAsScript(options)
  // process.exit(0)
  return result
}

export const runCompletion = async (client: OpenAI, params: any, options: IKBotTask) => {
  if (options.dry) {
    options.logger.info('Dry run - skipping API call')
    return false
  }
  const completion = await client.chat.completions.create({
    model: options.model,
    messages: params.messages,
    response_format: options.format as any,
  })
  const choice = completion?.choices?.[0]
  const usage = completion?.usage as any
  const choiceError = (choice as any)?.error

  if (!choice?.message?.content) {
    options.logger?.error(
      {
        model: options.model,
        router: options.router,
        id: completion?.id ?? null,
        finishReason: choice?.finish_reason ?? null,
        nativeFinishReason: (choice as any)?.native_finish_reason ?? null,
        choicesCount: completion?.choices?.length ?? 0,
        choiceError: choiceError ?? null,
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          cachedTokens: usage.prompt_tokens_details?.cached_tokens ?? null,
          reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? null,
          cost: usage.cost ?? null,
          costDetails: usage.cost_details ?? null,
        } : null,
      },
      `runCompletion: no content in response (finish_reason=${choice?.finish_reason ?? 'n/a'}${choiceError ? ` error=${choiceError.code}: ${choiceError.message}` : ''})`,
    )
    return ''
  }

  // Log token consumption + cost for every successful call
  if (usage) {
    options.logger?.info(
      {
        model: completion.model ?? options.model,
        router: options.router,
        id: completion.id,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cachedTokens: usage.prompt_tokens_details?.cached_tokens ?? null,
        cacheWriteTokens: usage.prompt_tokens_details?.cache_write_tokens ?? null,
        reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? null,
        cost: usage.cost ?? null,
        costDetails: usage.cost_details ?? null,
        isByok: usage.is_byok ?? null,
        webSearchRequests: usage.server_tool_use?.web_search_requests ?? null,
      },
      'runCompletion: usage',
    )
  }

  let result = choice.message.content
  result = await onCompletion(result, options)
  return result
}
