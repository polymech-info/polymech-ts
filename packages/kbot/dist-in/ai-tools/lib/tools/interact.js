import { toolLogger } from '../../index.js';
import { input, select } from '@inquirer/prompts';
export const tools = (target, options) => {
    const logger = toolLogger('interact', options);
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
                function: async (params) => {
                    try {
                        const answer = await input({
                            message: params.question,
                            default: params.default
                        });
                        return { response: answer };
                    }
                    catch (error) {
                        logger.error('Error asking question:', error.message);
                        return null;
                    }
                },
                parse: JSON.parse
            }
        },
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
                function: async (params) => {
                    try {
                        const answer = await select({
                            message: params.message,
                            choices: params.choices
                        });
                        return { response: answer };
                    }
                    catch (error) {
                        logger.error('Error in choice selection:', error.message);
                        return null;
                    }
                },
                parse: JSON.parse
            }
        }
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYWktdG9vbHMvbGliL3Rvb2xzL2ludGVyYWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUUzQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2pELE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQWMsRUFBRSxPQUFrQixFQUFjLEVBQUU7SUFDcEUsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUM5QyxPQUFPO1FBQ0g7WUFDSSxJQUFJLEVBQUUsVUFBVTtZQUNoQixRQUFRLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFdBQVcsRUFBRSw2Q0FBNkM7Z0JBQzFELFVBQVUsRUFBRTtvQkFDUixJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsUUFBUSxFQUFFOzRCQUNOLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSwwQkFBMEI7eUJBQzFDO3dCQUNELE9BQU8sRUFBRTs0QkFDTCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsZ0JBQWdCOzRCQUM3QixRQUFRLEVBQUUsSUFBSTt5QkFDakI7cUJBQ0o7b0JBQ0QsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDO2lCQUN6QjtnQkFDRCxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQVcsRUFBRSxFQUFFO29CQUM1QixJQUFJLENBQUM7d0JBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQ3RCOzRCQUNJLE9BQU8sRUFBRSxNQUFNLENBQUMsUUFBUTs0QkFDeEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO3lCQUMxQixDQUNKLENBQUE7d0JBQ0QsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQTtvQkFDL0IsQ0FBQztvQkFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO3dCQUNsQixNQUFNLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDdEQsT0FBTyxJQUFJLENBQUM7b0JBQ2hCLENBQUM7Z0JBQ0wsQ0FBQztnQkFDRCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7YUFDcEI7U0FDeUI7UUFDOUI7WUFDSSxJQUFJLEVBQUUsVUFBVTtZQUNoQixRQUFRLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLGVBQWU7Z0JBQ3JCLFdBQVcsRUFBRSwwQ0FBMEM7Z0JBQ3ZELFVBQVUsRUFBRTtvQkFDUixJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsT0FBTyxFQUFFOzRCQUNMLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSwwQkFBMEI7eUJBQzFDO3dCQUNELE9BQU8sRUFBRTs0QkFDTCxJQUFJLEVBQUUsT0FBTzs0QkFDYixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFOzRCQUN6QixXQUFXLEVBQUUsaUJBQWlCO3lCQUNqQzt3QkFDRCxRQUFRLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFNBQVM7NEJBQ2YsV0FBVyxFQUFFLDJCQUEyQjs0QkFDeEMsUUFBUSxFQUFFLElBQUk7eUJBQ2pCO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUM7aUJBQ25DO2dCQUNELFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBVyxFQUFFLEVBQUU7b0JBQzVCLElBQUksQ0FBQzt3QkFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FDdkI7NEJBQ0ksT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPOzRCQUN2QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87eUJBQzFCLENBQ0osQ0FBQzt3QkFDRixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFBO29CQUMvQixDQUFDO29CQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7d0JBQ2xCLE1BQU0sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUMxRCxPQUFPLElBQUksQ0FBQztvQkFDaEIsQ0FBQztnQkFDTCxDQUFDO2dCQUNELEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSzthQUNwQjtTQUN5QjtLQUNqQyxDQUFBO0FBQ0wsQ0FBQyxDQUFBIn0=