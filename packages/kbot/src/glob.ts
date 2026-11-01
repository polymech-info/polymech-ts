import * as path from 'node:path'
import { sync as dir } from '@polymech/fs/dir'
import { sync as exists } from '@polymech/fs/exists'
import { createItem as toNode } from '@polymech/fs/inspect'
import { isFile, forward_slash, resolveVariables } from '@polymech/commons'
import { globSync, hasMagic } from 'glob'
import { EXCLUDE_GLOB, MAX_FILE_SIZE } from './constants.js'
import { IKBotTask } from './ai-tools/index.js'
import { sourceVariables } from './variables.js'
import { E_GlobExtensionType, E_Mode } from './zod_schema.js'

export const default_filters = {
    isFile,
    exists,
    size: (filePath: string) => toNode(filePath).size < MAX_FILE_SIZE,
};

const isPathInside = (childPath: string, parentPath: string): boolean => {
    const relation = path.relative(parentPath, childPath);
    return Boolean(relation && !relation.startsWith('..') && !relation.startsWith('..' + path.sep));
};

export const isWebUrl = (str: string): boolean => /^https?:\/\//.test(str);

const globExtensionPresets: Map<E_GlobExtensionType, string> = new Map([
    ['match-cpp', '${SRC_DIR}/${SRC_NAME}*.cpp']
]);

const resolveAndGlobExtensionPattern = (resolvedPatternString: string): string[] => {
    try {
        if (!hasMagic(resolvedPatternString)) {
            if (default_filters.exists(resolvedPatternString) && default_filters.isFile(resolvedPatternString)) {
                return [forward_slash(resolvedPatternString)];
            }
            return [];
        } else {
            const foundFiles = globSync(resolvedPatternString, { absolute: true, nodir: true });
            return foundFiles.map(f => forward_slash(f));
        }
    } catch (e) { return []; }
};

export const glob = (
    projectPath: string,
    include: string[] = [],
    rawExcludeOptions: string[] = [],
    options?: IKBotTask
): { files: string[], webUrls: Set<string> } => {
    if (!exists(projectPath)) {
        dir(projectPath);
        return { files: [], webUrls: new Set<string>() };
    }

    const includeFilters = new Set<string>(); // Renamed from 'filters' to be specific
    const absolutePathsFromInclude = new Set<string>();
    const webUrls = new Set<string>();
    const staticIgnorePatterns = new Set<string>(EXCLUDE_GLOB);
    const dynamicExcludePatterns: string[] = [];

    (rawExcludeOptions || []).forEach(pattern => {
        if (pattern.includes('${')) { dynamicExcludePatterns.push(pattern); }
        else { staticIgnorePatterns.add(pattern); }
    });

    include.forEach(pattern => {
        if (isWebUrl(pattern)) { webUrls.add(pattern); return; }
        if (path.isAbsolute(pattern)) { absolutePathsFromInclude.add(path.resolve(pattern)); }
        else { includeFilters.add(pattern); }
    });

    const initialRelativeGlobResults = globSync([...includeFilters], {
        cwd: projectPath, absolute: false, ignore: [...staticIgnorePatterns], nodir: true
    });
    const allInitialInputFiles = new Set<string>([
        ...initialRelativeGlobResults.map(file => path.resolve(projectPath, file)),
        ...Array.from(absolutePathsFromInclude)
    ]);

    let filesSurvivingPrimaryDynamicExclude = new Set<string>();
    if (dynamicExcludePatterns.length > 0 && allInitialInputFiles.size > 0) {
        for (const inputFile of allInitialInputFiles) {
            let isDynamicallyExcluded = false;
            const fileVars = sourceVariables(inputFile, projectPath);
            for (const dynamicPattern of dynamicExcludePatterns) {
                const resolvedDynamicExcludeGlob = resolveVariables(dynamicPattern, false, fileVars, false);
                let foundExcludedMatches: string[] = [];
                try {
                    if (path.isAbsolute(resolvedDynamicExcludeGlob)) {
                        foundExcludedMatches = globSync(resolvedDynamicExcludeGlob, { absolute: true, nodir: true, cwd: process.cwd() });
                    } else {
                        foundExcludedMatches = globSync(resolvedDynamicExcludeGlob, { cwd: projectPath, absolute: true, nodir: true });
                    }
                } catch (e) { options?.logger?.warn(`[Dynamic Exclude] Error globbing exclude pattern ${resolvedDynamicExcludeGlob}: ${e.message}`); }
                
                if (foundExcludedMatches.length > 0) {
                    //options?.logger?.info(`[Dynamic Exclude - Pass 1] Input file ${path.relative(projectPath, inputFile)} excluded by pattern ${resolvedDynamicExcludeGlob}`);
                    isDynamicallyExcluded = true;
                    break;
                }
            }
            if (!isDynamicallyExcluded) {
                filesSurvivingPrimaryDynamicExclude.add(inputFile);
            }
        }
    } else {
        filesSurvivingPrimaryDynamicExclude = new Set<string>(allInitialInputFiles);
    }

    const finalCandidates = new Set<string>(filesSurvivingPrimaryDynamicExclude);

    if (options && typeof options.globExtension === 'string' && options.globExtension.trim() !== '') {
        let patternFromPresetOrCustom = options.globExtension;
        if (globExtensionPresets.has(options.globExtension as E_GlobExtensionType)) {
            patternFromPresetOrCustom = globExtensionPresets.get(options.globExtension as E_GlobExtensionType)!;
        }
        for (const sourceFileForExtension of filesSurvivingPrimaryDynamicExclude) { 
            const fileVars = sourceVariables(sourceFileForExtension, projectPath);
            const fullyResolvedPattern = resolveVariables(patternFromPresetOrCustom, false, fileVars, false);
            const additionalFiles = resolveAndGlobExtensionPattern(fullyResolvedPattern);
            additionalFiles.forEach(f => finalCandidates.add(f));
        }
    }

    const trulyFinalFiles = Array.from(finalCandidates).filter(absoluteFilePath => {
        if (!Object.keys(default_filters).every((key) => default_filters[key](absoluteFilePath))) {
            return false;
        }
        const relativeFilePath = path.relative(projectPath, absoluteFilePath);
        const staticCheckResult = globSync([forward_slash(relativeFilePath)], {
            cwd: projectPath, ignore: [...staticIgnorePatterns], nodir: true, absolute: false
        });
        if (staticCheckResult.length === 0) { return false; }
        return true;
    });

    return { files: trulyFinalFiles.map(f => forward_slash(f)), webUrls };
};
