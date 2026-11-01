import * as path from 'path';
import { simpleGit } from 'simple-git';
import { sync as exists } from '@polymech/fs/exists';
import { substitute } from '@polymech/commons';
import { logger } from '../../index.js';
import { toolLogger } from '../../index.js';
import { findUpSync } from 'find-up';
const commitFiles = async (filePaths, commitMessage, targetDirectory, variables = {}) => {
    try {
        if (!filePaths || !filePaths.length) {
            logger.warn(`No files to commit`);
            return;
        }
        if (!exists(path.join(targetDirectory, '.git'))) {
            try {
                logger.info(`Initializing repository at ${targetDirectory}`);
                await initRepository(targetDirectory);
            }
            catch (e) {
                logger.error(`Error initializing repository at ${targetDirectory} `, e.message, filePaths);
            }
        }
        const git = simpleGit(targetDirectory);
        try {
            await git.add(filePaths);
        }
        catch (e) {
            logger.error('Error adding files:', e.message, filePaths);
        }
        await git.commit(commitMessage);
        try {
            await git.raw(['branch', '-M', 'master']);
            const repo = substitute(false, "${GIT_REPO}/${GIT_USER}/${REPO_NAME}.git", {
                REPO_NAME: path.basename(targetDirectory),
                ...variables
            });
            await git.raw(['remote', 'add', 'origin', repo]);
            await git.push(['--set-upstream', 'origin', 'master']);
            return true;
        }
        catch (e) {
            if (e.message.includes('remote origin already exists')) {
                await git.push(['--set-upstream', 'origin', 'master']);
            }
            else {
                logger.error('Tools::GIT : Error pushing files:', e.message, filePaths);
            }
        }
    }
    catch (error) {
        logger.error('Error committing files:', error.message, filePaths);
        throw error;
    }
};
const initRepository = async (targetDirectory, variables = {}) => {
    try {
        const git = simpleGit(targetDirectory);
        if (!exists(path.join(targetDirectory, '.git'))) {
            await git.init();
            logger.info('Git repository initialized successfully!');
            return true;
        }
        logger.info('Git repository already exists');
        return false;
    }
    catch (error) {
        logger.error('Error initializing git repository:', error.message);
        return false;
    }
};
export const tools = (target, options) => {
    const logger = toolLogger('git', options);
    if (!target) {
        logger.warn(`Tools:GIT : Target is required`);
        return [];
    }
    if (!exists(target)) {
        logger.warn(`Tools:GIT : Project path doesnt exists ${target}`);
        return [];
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
                    logger.info(`Tool::init_repository Init Repository in ${target}`);
                    const gitDir = findUpSync('.git', { type: 'directory', cwd: target });
                    if (gitDir && exists(gitDir)) {
                        logger.info(`Repository already exists at ${gitDir}`);
                        return true;
                    }
                    try {
                        const ret = await initRepository(target, options.variables);
                        return true;
                    }
                    catch (error) {
                        logger.error(`Error initializing repository`, error);
                        return false;
                    }
                },
                parse: JSON.parse,
            }
        },
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
                    debugger;
                    try {
                        const { files, message } = ret;
                        logger.info(`Tool::GIT Commit files ${files} in ${target}`);
                        if (!target) {
                            logger.error(`Tool::Git Commit : Target is required`);
                            return;
                        }
                        if (!exists(target)) {
                            logger.error(`Project doesnt path exists ${target}`);
                            return;
                        }
                        await commitFiles(files, message, target, options.variables);
                    }
                    catch (error) {
                        logger.error(`Error committing dependencies : ${error.message}`);
                    }
                    return true;
                },
                parse: JSON.parse,
            },
        }
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi90b29scy9naXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUE7QUFHNUIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFPLFlBQVksQ0FBQTtBQUV2QyxPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUU5QyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFDdkMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBRzNDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUE7QUFFcEMsTUFBTSxXQUFXLEdBQUcsS0FBSyxFQUFFLFNBQW1CLEVBQUUsYUFBcUIsRUFBRSxlQUF1QixFQUFFLFlBQW9DLEVBQUUsRUFBRSxFQUFFO0lBQ3RJLElBQUksQ0FBQztRQUNELElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO1lBQ2pDLE9BQU07UUFDVixDQUFDO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDOUMsSUFBSSxDQUFDO2dCQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsOEJBQThCLGVBQWUsRUFBRSxDQUFDLENBQUE7Z0JBQzVELE1BQU0sY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFBO1lBQ3pDLENBQUM7WUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO2dCQUNkLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLGVBQWUsR0FBRyxFQUFF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