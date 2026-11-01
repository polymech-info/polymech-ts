import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../index.js';
import pMap from "p-map";
import { sync as exists } from '@polymech/fs/exists';
import { toolLogger } from '../../index.js';
const execAsync = promisify(exec);
const install = async (dependency, directory) => {
    return new Promise((resolve, reject) => {
        const command = `pnpm add ${dependency} --dir ${directory}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error installing ${dependency}:`, error.message);
                return resolve(false);
            }
            logger.info(`Successfully installed "${dependency}" in "${directory}".`);
        });
    });
};
export const tools = (target, options) => {
    const logger = toolLogger('npm', options);
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
                    }
                    catch (error) {
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
        },
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
                function: async (params) => {
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
                    }
                    catch (error) {
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
        },
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
                        const { dependencies } = ret;
                        if (!target) {
                            logger.error(`Tool::NPM Target is required to install dependencies`);
                            return;
                        }
                        if (!exists(target)) {
                            logger.error(`Project doesnt path exists ${target}`);
                            return;
                        }
                        await pMap(dependencies, (async (dependency) => {
                            logger.info(`Installing dependency`, dependency);
                            try {
                                return install(dependency, target);
                            }
                            catch (error) {
                                logger.error(`Error installing dependency ${dependency} `, error);
                            }
                        }), {
                            concurrency: 1
                        });
                    }
                    catch (error) {
                        logger.error(`Error installing dependencies`, error);
                    }
                },
                parse: JSON.parse,
            }
        }
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi90b29scy9ucG0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGVBQWUsQ0FBQTtBQUNwQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBQ2hDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUN2QyxPQUFPLElBQUksTUFBTSxPQUFPLENBQUE7QUFDeEIsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUVwRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFFM0MsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2pDLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxVQUFrQixFQUFFLFNBQWlCLEVBQWdCLEVBQUU7SUFDMUUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNuQyxNQUFNLE9BQU8sR0FBRyxZQUFZLFVBQVUsVUFBVSxTQUFTLEVBQUUsQ0FBQTtRQUMzRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNwQyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNSLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLFVBQVUsR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFDOUQsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDekIsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsMkJBQTJCLFVBQVUsU0FBUyxTQUFTLElBQUksQ0FBQyxDQUFBO1FBQzVFLENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFD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