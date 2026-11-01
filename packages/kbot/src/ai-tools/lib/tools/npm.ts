import path from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../../index.js'
import pMap from "p-map"
import { sync as exists } from '@polymech/fs/exists'
import { IKBotTask } from '../../types.js'
import { toolLogger } from '../../index.js'

const execAsync = promisify(exec)
const install = async (dependency: string, directory: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const command = `pnpm add ${dependency} --dir ${directory}`
        exec(command, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error installing ${dependency}:`, error.message)
                return resolve(false)
            }
            logger.info(`Successfully installed "${dependency}" in "${directory}".`)
        })
    })
}
export const tools = (target: string, options: IKBotTask): Array<any> => {
    const logger = toolLogger('npm', options)
    return [
        {
            type: 'function',
            function: {
                name: 'build_project',
                description: 'Build project using pnpm build command',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                },
                function: async () => {
                    try {
                        logger.debug(`Tool::BuildProject Building project at ${target}`);
                        const { stdout, stderr } = await execAsync('pnpm build', {
                            cwd: target
                        });
                        return {
                            success: !stderr,
                            output: stdout,
                            error: stderr || null
                        };
                    } catch (error: any) {
                        logger.error('Error building project', error);
                        return {
                            success: false,
                            output: null,
                            error: error.message
                        };
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
        {
            type: 'function',
            function: {
                name: 'run_npm',
                description: 'Run an npm/pnpm command',
                parameters: {
                    type: 'object',
                    properties: {
                        command: { type: 'string', description: 'Command to run (e.g. install, test, etc)' },
                        args: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Additional arguments for the command',
                            optional: true
                        }
                    },
                    required: ['command']
                },
                function: async (params: any) => {
                    try {
                        const args = params.args ? params.args.join(' ') : '';
                        const fullCommand = `pnpm ${params.command} ${args}`.trim();
                        logger.debug(`Tool::RunNpm Running command: ${fullCommand}`);
                        const { stdout, stderr } = await execAsync(fullCommand, {
                            cwd: target
                        });

                        return {
                            success: !stderr,
                            output: stdout,
                            error: stderr || null
                        };
                    } catch (error: any) {
                        logger.error('Error running npm command', error);
                        return {
                            success: false,
                            output: null,
                            error: error.message
                        };
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
        {
            type: 'function',
            function: {
                name: "install_dependency",
                description: "Install a dependency using npm",
                parameters: {
                    type: "object",
                    properties: {
                        dependencies: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        }
                    },
                    required: ["dependencies"],
                },
                function: async (ret) => {
                    try {
                        const { dependencies } = ret as any
                        if (!target) {
                            logger.error(`Tool::NPM Target is required to install dependencies`)
                            return
                        }
                        if (!exists(target)) {
                            logger.error(`Project doesnt path exists ${target}`)
                            return
                        }
                        await pMap(dependencies, (async (dependency: string) => {
                            logger.info(`Installing dependency`, dependency)
                            try {
                                return install(dependency, target)
                            } catch (error) {
                                logger.error(`Error installing dependency ${dependency} `, error)
                            }
                        }), {
                            concurrency: 1
                        })

                    } catch (error) {
                        logger.error(`Error installing dependencies`, error)
                    }
                },
                parse: JSON.parse,
            }
        } as RunnableToolFunction<{ id: string }>
    ]
}