import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG_DEFAULT } from '@polymech/commons';
import { sync as read } from '@polymech/fs/read';
import { sync as write } from '@polymech/fs/write';
import { sync as exists } from '@polymech/fs/exists';
import { logger } from '../index.js';
import { fetchOpenAIModels } from '../models/openai.js';
import { fetchOpenRouterModels } from '../models/openrouter.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generateModelEnum = (models, provider) => {
    const enumName = `E_${provider.toUpperCase()}_MODEL`;
    const enumContent = `export enum ${enumName} {
${models.map(model => `  MODEL_${model.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()} = "${model.id}"`).join(',\n')}
}`;
    return enumContent;
};
const generateModelEnumFree = (models, provider) => {
    const enumName = `E_${provider.toUpperCase()}_MODEL_FREE`;
    const freeModels = models.filter(model => {
        if (!model.pricing)
            return false;
        const pricing = model.pricing;
        return ((pricing.prompt === 0 || pricing.prompt === "0") &&
            (pricing.completion === 0 || pricing.completion === "0") &&
            (pricing.image === 0 || pricing.image === "0"));
    });
    const enumContent = `export enum ${enumName} {
${freeModels.map(model => `  MODEL_FREE_${model.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()} = "${model.id}"`).join(',\n')}
}`;
    return enumContent;
};
const generateModelEnumTools = (models, provider) => {
    const enumName = `E_${provider.toUpperCase()}_MODEL`;
    const toolModels = models.filter(model => {
        if (!model.top_provider)
            return false;
        return model.top_provider.supports_functions === true ||
            model.top_provider.supports_function_calling === true ||
            model.top_provider.supports_tools === true;
    });
    const enumContent = `export enum ${enumName} {
${toolModels.map(model => `  MODEL_TOOLS_${model.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()} = "${model.id}"`).join(',\n')}
}`;
    return enumContent;
};
export const build = async () => {
    const examplesSrc = path.resolve(__dirname, '../../docs_/examples.md');
    if (exists(examplesSrc)) {
        const examples = read(examplesSrc, 'string') || '';
        const examplesPath = path.resolve(__dirname, '../src/docs-internal/examples.ts');
        write(examplesPath, `export const examples = ${JSON.stringify(examples)}`);
        logger.info(`Examples file generated " ${examplesPath}`);
    }
    else {
        logger.error(`Examples file not found ${examplesSrc}`);
    }
    const config = CONFIG_DEFAULT();
    const modelsOpenAI = await fetchOpenAIModels(config.openai.key);
    const modelsOpenRouter = (await fetchOpenRouterModels()).map((model) => {
        return {
            id: model.id,
            name: model.name,
            pricing: model.pricing,
            context: model.context,
            created: model.created,
            top_provider: model.top_provider
        };
    });
    // Generate model enums
    const openAIEnumPath = path.resolve(__dirname, '../../src/models/cache/openai-models.ts');
    const openRouterEnumPath = path.resolve(__dirname, '../../src/models/cache/openrouter-models.ts');
    const openAIEnumFreePath = path.resolve(__dirname, '../../src/models/cache/openai-models-free.ts');
    const openRouterEnumFreePath = path.resolve(__dirname, '../../src/models/cache/openrouter-models-free.ts');
    const openAIEnumToolsPath = path.resolve(__dirname, '../../src/models/cache/openai-models-tools.ts');
    const openRouterEnumToolsPath = path.resolve(__dirname, '../../src/models/cache/openrouter-models-tools.ts');
    write(openAIEnumPath, generateModelEnum(modelsOpenAI, 'OpenAI'));
    write(openRouterEnumPath, generateModelEnum(modelsOpenRouter, 'OpenRouter'));
    write(openAIEnumFreePath, generateModelEnumFree(modelsOpenAI, 'OpenAI'));
    write(openRouterEnumFreePath, generateModelEnumFree(modelsOpenRouter, 'OpenRouter'));
    write(openAIEnumToolsPath, generateModelEnumTools(modelsOpenAI, 'OpenAI'));
    write(openRouterEnumToolsPath, generateModelEnumTools(modelsOpenRouter, 'OpenRouter'));
    logger.info('Model enums generated');
    // Write model data
    const modelsOpenAIPath = path.resolve(__dirname, '../src/models/cache/openai.ts');
    write(modelsOpenAIPath, `export const models = ${JSON.stringify(modelsOpenAI)}`);
    const modelsOpenRouterPath = path.resolve(__dirname, '../src/models/cache/openrouter.ts');
    write(modelsOpenRouterPath, `export const models = ${JSON.stringify(modelsOpenRouter)}`);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvYnVpbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQzVCLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxVQUFVLENBQUE7QUFDeEMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRWxELE9BQU8sRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDaEQsT0FBTyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBRXBELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDdkQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0seUJBQXlCLENBQUE7QUFFL0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBRTlELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxNQUFhLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO0lBQzVELE1BQU0sUUFBUSxHQUFHLEtBQUssUUFBUSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUE7SUFDcEQsTUFBTSxXQUFXLEdBQUcsZUFBZSxRQUFRO0VBQzNDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsT0FBTyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxJ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