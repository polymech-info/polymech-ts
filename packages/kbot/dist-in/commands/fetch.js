import path from 'node:path';
import { sync as write } from '@polymech/fs/write';
import { logger, module_root } from '../index.js';
import { fetchOpenAIModels } from '../models/openai.js';
import { fetchOpenRouterModels } from '../models/openrouter.js';
import { CONFIG_DEFAULT } from '@polymech/commons';
export const fetch = async () => {
    const config = CONFIG_DEFAULT();
    if (config.openai && config.openai.key) {
        const modelsOpenAI = await fetchOpenAIModels(config.openai.key);
        if (modelsOpenAI) {
            const modelsOpenAIPath = path.resolve(module_root(), 'openai.json');
            write(modelsOpenAIPath, modelsOpenAI);
            logger.info(`Fetched ${modelsOpenAI.length} OpenAI models, to ${modelsOpenAIPath}`);
        }
        else {
            logger.error(`Failed to fetch OpenAI models`);
        }
    }
    const modelsOpenRouter = (await fetchOpenRouterModels()).map((model) => {
        return {
            id: model.id,
            name: model.name,
            pricing: model.pricing,
            context: model.context,
            created: model.created
        };
    });
    const modelsOpenRouterPath = path.resolve(module_root(), 'openrouter.json');
    write(modelsOpenRouterPath, modelsOpenRouter);
    logger.info(`Fetched ${modelsOpenRouter.length} OpenRouter models, to ${modelsOpenRouterPath}`);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmV0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvZmV0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQzVCLE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDbEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDakQsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDdkQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0seUJBQXlCLENBQUE7QUFDL0QsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRWxELE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxLQUFLLElBQUksRUFBRTtJQUU5QixNQUFNLE1BQU0sR0FBRyxjQUFjLEVBQVMsQ0FBQTtJQUN0QyxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN2QyxNQUFNLFlBQVksR0FBRyxNQUFNLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDL0QsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNqQixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUE7WUFDbkUsS0FBSyxDQUFDLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxDQUFBO1lBQ3JDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxZQUFZLENBQUMsTUFBTSxzQkFBc0IsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFBO1FBQ3JGLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFBO1FBQy9DLENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLE1BQU0scUJBQXFCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ3JFLE9BQU87WUFDTCxFQUFFLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDWixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7WUFDaEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1lBQ3RCLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztZQUN0QixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLGlCQUFpQixDQUFDLENBQUE7SUFDM0UsS0FBSyxDQUFDLG9CQUFvQixFQUFFLGdCQUFnQixDQUFDLENBQUE7SUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLGdCQUFnQixDQUFDLE1BQU0sMEJBQTBCLG9CQUFvQixFQUFFLENBQUMsQ0FBQTtBQUNqRyxDQUFDLENBQUEifQ==