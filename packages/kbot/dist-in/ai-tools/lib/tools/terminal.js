import * as path from 'path';
import { spawn } from 'child_process';
import { toolLogger } from '../../index.js';
import { Helper } from './process.js';
export const tools = (target, options) => {
    const logger = toolLogger('terminal', options);
    return [
        {
            type: 'function',
            function: {
                name: 'execute_command',
                description: 'Execute a terminal command and capture output',
                parameters: {
                    type: 'object',
                    properties: {
                        command: {
                            type: 'string',
                            description: 'Command to execute'
                        },
                        args: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Command arguments',
                            optional: true
                        },
                        cwd: {
                            type: 'string',
                            description: 'Working directory for command execution',
                            optional: true
                        },
                        background: {
                            type: 'boolean',
                            description: 'Run command in background (non-blocking)',
                            optional: true,
                            default: false
                        },
                        window: {
                            type: 'boolean',
                            description: 'Open command in new terminal window',
                            optional: true,
                            default: false
                        },
                        detached: {
                            type: 'boolean',
                            description: 'Run process detached from parent',
                            optional: true,
                            default: false
                        }
                    },
                    required: ['command']
                },
                function: async (params) => {
                    try {
                        debugger;
                        const cwd = params.cwd ? path.join(target, params.cwd) : target;
                        const args = params.args || [];
                        logger.debug(`Tool::Terminal : ExecuteCommand Running '${params.command}' in ${cwd}`, params);
                        if (params.detached) {
                            const isWindows = process.platform === 'win32';
                            if (isWindows) {
                                spawn('cmd', ['/c', 'start', 'cmd', '/k', params.command, ...args], {
                                    cwd: cwd,
                                    detached: true,
                                    stdio: 'ignore'
                                });
                            }
                            else {
                                // For macOS/Linux
                                spawn('x-terminal-emulator', ['-e', `${params.command} ${args.join(' ')}`], {
                                    cwd: cwd,
                                    detached: true,
                                    stdio: 'ignore'
                                });
                            }
                            return {
                                success: true,
                                output: 'Command launched in new window',
                                error: null
                            };
                        }
                        if (params.background || params.detached) {
                            const child = spawn(params.command, args, {
                                cwd: cwd,
                                detached: params.detached === true,
                                stdio: 'ignore'
                            });
                            if (params.detached) {
                                child.unref();
                            }
                            return {
                                success: true,
                                output: `Process started with PID: ${child.pid}`,
                                error: null
                            };
                        }
                        const cmd = `${params.command} ${args.join(' ')}`.trim();
                        logger.debug(`Tool::ExecuteCommand Running '${cmd}' in ${cwd}`);
                        const collector = [];
                        const ret = await Helper.run(cwd, cmd, [], collector, true);
                        return ret;
                    }
                    catch (error) {
                        logger.error('Error executing command', error);
                        return {
                            success: false,
                            output: null,
                            error: error.message
                        };
                    }
                },
                parse: JSON.parse
            }
        }
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYWktdG9vbHMvbGliL3Rvb2xzL3Rlcm1pbmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBRTVCLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFDckMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBRTNDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFFckMsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBYyxFQUFFLE9BQWtCLEVBQWMsRUFBRTtJQUNwRSxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzlDLE9BQU87UUFDSDtZQUNJLElBQUksRUFBRSxVQUFVO1lBQ2hCLFFBQVEsRUFBRTtnQkFDTixJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixXQUFXLEVBQUUsK0NBQStDO2dCQUM1RCxVQUFVLEVBQUU7b0JBQ1IsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE9BQU8sRUFBRTs0QkFDTCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsb0JBQW9CO3lCQUNwQzt3QkFDRCxJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLE9BQU87NEJBQ2IsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTs0QkFDekIsV0FBVyxFQUFFLG1CQUFtQjs0QkFDaEMsUUFBUSxFQUFFLElBQUk7eUJBQ2pCO3dCQUNELEdBQUcsRUFBRTs0QkFDRCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUseUNBQXlDOzRCQUN0RCxRQUFRLEVBQUUsSUFBSTt5QkFDakI7d0JBQ0QsVUFBVSxFQUFFOzRCQUNSLElBQUksRUFBRSxTQUFTOzRCQUNmLFdBQVcs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