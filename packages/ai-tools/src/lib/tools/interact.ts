import * as path from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'
import { toolLogger } from '../../index.js'
import { IKBotTask } from '../../types.js'
import { input, select } from '@inquirer/prompts'
export const tools = (target: string, options: IKBotTask): Array<any> => {
    const logger = toolLogger('interact', options)
    return [
        {
            type: 'function',
            function: {
                name: 'ask_question',
                description: 'Ask user a simple question and get response',
                parameters: {
                    type: 'object',
                    properties: {
                        question: {
                            type: 'string',
                            description: 'Question to ask the user'
                        },
                        default: {
                            type: 'string',
                            description: 'Default answer',
                            optional: true
                        }
                    },
                    required: ['question']
                },
                function: async (params: any) => {
                    try {
                        const answer = await input(
                            {
                                message: params.question,
                                default: params.default
                            }
                        )
                        return { response: answer }
                    } catch (error: any) {
                        logger.error('Error asking question:', error.message);
                        return null;
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
        {
            type: 'function',
            function: {
                name: 'choose_option',
                description: 'Ask user to choose from multiple options',
                parameters: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Message to show the user'
                        },
                        choices: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of choices'
                        },
                        multiple: {
                            type: 'boolean',
                            description: 'Allow multiple selections',
                            optional: true
                        }
                    },
                    required: ['message', 'choices']
                },
                function: async (params: any) => {
                    try {
                        const answer = await select(
                            {
                                message: params.message,
                                choices: params.choices
                            }
                        );
                        return { response: answer }
                    } catch (error: any) {
                        logger.error('Error in choice selection:', error.message);
                        return null;
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>
    ]
}