import * as path from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'
import { spawn } from 'child_process'
import { toolLogger } from '../../index.js'
import { IKBotTask } from '../../types.js'
import { Helper } from './process.js'

export const tools = (target: string, options: IKBotTask): Array<any> => {
    const logger = toolLogger('terminal', options)
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
                function: async (params: any) => {
                    try {
                        debugger
                        const cwd = params.cwd ? path.join(target, params.cwd) : target;
                        const args = params.args || [];
                        logger.debug(`Tool::Terminal : ExecuteCommand Running '${params.command}' in ${cwd}`, params)
                        if (params.detached) {
                            const isWindows = process.platform === 'win32';
                            if (isWindows) {
                                spawn('cmd', ['/c', 'start', 'cmd', '/k', params.command, ...args], {
                                    cwd: cwd,
                                    detached: true,
                                    stdio: 'ignore'
                                });
                            } else {
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
                        const collector = []
                        const ret = await Helper.run(cwd, cmd, [], collector, true)
                        return ret
                    } catch (error: any) {
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
        } as RunnableToolFunction<any>
    ]
}