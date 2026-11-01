import { marked } from 'marked';
import * as path from 'node:path';
import { resolve } from '@polymech/commons';
import { dumpAsScript } from '../utils/script.js';
import { applyFilters } from '../filters.js';
import { variables } from '../variables.js';
import { writeOrAppend } from '../utils/merge.js';
export const onCompletion = async (result = "", options) => {
    result = applyFilters(result, options.filters || []);
    let vars = variables(options);
    if (options.dst) {
        vars = {
            ...vars,
            MODEL: options.model ? path.parse(options.model).name : 'unknown_model',
            ROUTER: options.router || 'unknown_router',
        };
        const dstPath = path.resolve(resolve(options.dst, options.alt, vars));
        writeOrAppend(dstPath, result, options.append);
        const action = options.append ? `${options.append} content to` : 'Wrote completion result to';
        options.logger?.debug(`${action} ${dstPath} : ${options.dst}`);
    }
    else if (!options.silent) {
        const content = marked(result);
        process.stdout.write(content);
    }
    dumpAsScript(options);
    // process.exit(0)
    return result;
};
export const runCompletion = async (client, params, options) => {
    if (options.dry) {
        options.logger.info('Dry run - skipping API call');
        return false;
    }
    const completion = await client.chat.completions.create({
        model: options.model,
        messages: params.messages,
        response_format: options.format,
    });
    const choice = completion?.choices?.[0];
    const usage = completion?.usage;
    const choiceError = choice?.error;
    if (!choice?.message?.content) {
        options.logger?.error({
            model: options.model,
            router: options.router,
            id: completion?.id ?? null,
            finishReason: choice?.finish_reason ?? null,
            nativeFinishReason: choice?.native_finish_reason ?? null,
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
        }, `runCompletion: no content in response (finish_reason=${choice?.finish_reason ?? 'n/a'}${choiceError ? ` error=${choiceError.code}: ${choiceError.message}` : ''})`);
        return '';
    }
    // Log token consumption + cost for every successful call
    if (usage) {
        options.logger?.info({
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
        }, 'runCompletion: usage');
    }
    let result = choice.message.content;
    result = await onCompletion(result, options);
    return result;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLWNvbXBsZXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvcnVuLWNvbXBsZXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFFBQVEsQ0FBQTtBQUMvQixPQUFPLEtBQUssSUFBSSxNQUFNLFdBQVcsQ0FBQTtBQUNqQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFHM0MsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQ2pELE9BQU8sRUFBRSxZQUFZLEVBQVUsTUFBTSxlQUFlLENBQUE7QUFDcEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGlCQUFpQixDQUFBO0FBQzNDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUdqRCxNQUFNLENBQUMsTUFBTSxZQUFZLEdBQUcsS0FBSyxFQUFFLFNBQWMsRUFBRSxFQUFFLE9BQWtCLEVBQUUsRUFBRTtJQUN6RSxNQUFNLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsT0FBbUIsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUNoRSxJQUFJLElBQUksR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDN0IsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxHQUFHO1lBQ0wsR0FBRyxJQUFJO1lBQ1AsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZTtZQUN2RSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sSUFBSSxnQkFBZ0I7U0FDM0MsQ0FBQTtRQUNELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8s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