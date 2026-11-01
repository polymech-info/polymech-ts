import * as path from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'

import { simpleGit }  from 'simple-git'

import { sync as exists } from '@polymech/fs/exists'
import { substitute } from '@polymech/commons'

import { logger } from '../../index.js'
import { toolLogger } from '../../index.js'
import { IKBotTask } from '../../types.js'

import { findUpSync } from 'find-up'

const commitFiles = async (filePaths: string[], commitMessage: string, targetDirectory: string, variables: Record<string, string> = {}) => {
    try {
        if (!filePaths || !filePaths.length) {
            logger.warn(`No files to commit`)
            return
        }
        if (!exists(path.join(targetDirectory, '.git'))) {
            try {
                logger.info(`Initializing repository at ${targetDirectory}`)
                await initRepository(targetDirectory)
            } catch (e: any) {
                logger.error(`Error initializing repository at ${targetDirectory} `, e.message, filePaths)
            }
        }

        const git: any = simpleGit(targetDirectory);
        try {
            await git.add(filePaths);
        } catch (e: any) {
            logger.error('Error adding files:', e.message, filePaths);
        }
        await git.commit(commitMessage)
        try {
            await git.raw(['branch', '-M', 'master']);
            const repo = substitute(false, "${GIT_REPO}/${GIT_USER}/${REPO_NAME}.git", {
                REPO_NAME: path.basename(targetDirectory),
                ...variables
            })
            await git.raw(['remote', 'add', 'origin', repo])
            await git.push(['--set-upstream', 'origin', 'master'])
            return true
        } catch (e: any) {
            if (e.message.includes('remote origin already exists')) {
                await git.push(['--set-upstream', 'origin', 'master']);
            } else {
                logger.error('Tools::GIT : Error pushing files:', e.message, filePaths);
            }
        }
    } catch (error: any) {
        logger.error('Error committing files:', error.message, filePaths);
        throw error
    }
}

const initRepository = async (targetDirectory: string, variables: Record<string, string> = {}): Promise<boolean> => {
    try {
        const git: any = simpleGit(targetDirectory);
        if (!exists(path.join(targetDirectory, '.git'))) {
            await git.init();
            logger.info('Git repository initialized successfully!');
            return true;
        }
        logger.info('Git repository already exists');
        return false
    } catch (error: any) {
        logger.error('Error initializing git repository:', error.message);
        return false
    }
}

export const tools = (target: string, options: IKBotTask): Array<any> => {
    const logger = toolLogger('git', options)
    if (!target) {
        logger.warn(`Tools:GIT : Target is required`)
        return []
    }
    if (!exists(target)) {
        logger.warn(`Tools:GIT : Project path doesnt exists ${target}`)
        return []
    }
    return [
        {
            type: 'function',
            function: {
                name: "init_repository",
                description: "Initialize a new git repository",
                parameters: {
                    type: "object",
                    properties: {},
                    required: []
                },
                function: async (params) => {
                    logger.info(`Tool::init_repository Init Repository in ${target}`)
                    const gitDir = findUpSync('.git',{ type: 'directory', cwd: target})
                    if(gitDir && exists(gitDir)){
                        logger.info(`Repository already exists at ${gitDir}`)
                        return true
                    }
                    try {
                        const ret = await initRepository(target, options.variables)
                        return true
                    } catch (error) {
                        logger.error(`Error initializing repository`, error)
                        return false;
                    }
                },
                parse: JSON.parse,
            }
        } as RunnableToolFunction<{ id: string }>,
        {
            type: 'function',
            function: {
                name: "commit_files_git",
                description: "Commit files using git",
                parameters: {
                    type: "object",
                    properties: {
                        files: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },
                        message: {
                            type: "string"
                        }
                    },
                    required: ["files"],
                },
                function: async (ret) => {
                    debugger
                    try {
                        const { files, message } = ret as any
                        logger.info(`Tool::GIT Commit files ${files} in ${target}`)
                        if (!target) {
                            logger.error(`Tool::Git Commit : Target is required`)
                            return
                        }
                        if (!exists(target)) {
                            logger.error(`Project doesnt path exists ${target}`)
                            return
                        }
                        await commitFiles(files, message, target, options.variables)
                    } catch (error: any) {
                        logger.error(`Error committing dependencies : ${error.message}`)
                    }
                    return true
                },
                parse: JSON.parse,
            },
        } as RunnableToolFunction<{ id: string }>
    ]
}