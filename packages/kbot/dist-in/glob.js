import * as path from 'node:path';
import { sync as dir } from '@polymech/fs/dir';
import { sync as exists } from '@polymech/fs/exists';
import { createItem as toNode } from '@polymech/fs/inspect';
import { isFile, forward_slash, resolveVariables } from '@polymech/commons';
import { globSync, hasMagic } from 'glob';
import { EXCLUDE_GLOB, MAX_FILE_SIZE } from './constants.js';
import { sourceVariables } from './variables.js';
export const default_filters = {
    isFile,
    exists,
    size: (filePath) => toNode(filePath).size < MAX_FILE_SIZE,
};
const isPathInside = (childPath, parentPath) => {
    const relation = path.relative(parentPath, childPath);
    return Boolean(relation && !relation.startsWith('..') && !relation.startsWith('..' + path.sep));
};
export const isWebUrl = (str) => /^https?:\/\//.test(str);
const globExtensionPresets = new Map([
    ['match-cpp', '${SRC_DIR}/${SRC_NAME}*.cpp']
]);
const resolveAndGlobExtensionPattern = (resolvedPatternString) => {
    try {
        if (!hasMagic(resolvedPatternString)) {
            if (default_filters.exists(resolvedPatternString) && default_filters.isFile(resolvedPatternString)) {
                return [forward_slash(resolvedPatternString)];
            }
            return [];
        }
        else {
            const foundFiles = globSync(resolvedPatternString, { absolute: true, nodir: true });
            return foundFiles.map(f => forward_slash(f));
        }
    }
    catch (e) {
        return [];
    }
};
export const glob = (projectPath, include = [], rawExcludeOptions = [], options) => {
    if (!exists(projectPath)) {
        dir(projectPath);
        return { files: [], webUrls: new Set() };
    }
    const includeFilters = new Set(); // Renamed from 'filters' to be specific
    const absolutePathsFromInclude = new Set();
    const webUrls = new Set();
    const staticIgnorePatterns = new Set(EXCLUDE_GLOB);
    const dynamicExcludePatterns = [];
    (rawExcludeOptions || []).forEach(pattern => {
        if (pattern.includes('${')) {
            dynamicExcludePatterns.push(pattern);
        }
        else {
            staticIgnorePatterns.add(pattern);
        }
    });
    include.forEach(pattern => {
        if (isWebUrl(pattern)) {
            webUrls.add(pattern);
            return;
        }
        if (path.isAbsolute(pattern)) {
            absolutePathsFromInclude.add(path.resolve(pattern));
        }
        else {
            includeFilters.add(pattern);
        }
    });
    const initialRelativeGlobResults = globSync([...includeFilters], {
        cwd: projectPath, absolute: false, ignore: [...staticIgnorePatterns], nodir: true
    });
    const allInitialInputFiles = new Set([
        ...initialRelativeGlobResults.map(file => path.resolve(projectPath, file)),
        ...Array.from(absolutePathsFromInclude)
    ]);
    let filesSurvivingPrimaryDynamicExclude = new Set();
    if (dynamicExcludePatterns.length > 0 && allInitialInputFiles.size > 0) {
        for (const inputFile of allInitialInputFiles) {
            let isDynamicallyExcluded = false;
            const fileVars = sourceVariables(inputFile, projectPath);
            for (const dynamicPattern of dynamicExcludePatterns) {
                const resolvedDynamicExcludeGlob = resolveVariables(dynamicPattern, false, fileVars, false);
                let foundExcludedMatches = [];
                try {
                    if (path.isAbsolute(resolvedDynamicExcludeGlob)) {
                        foundExcludedMatches = globSync(resolvedDynamicExcludeGlob, { absolute: true, nodir: true, cwd: process.cwd() });
                    }
                    else {
                        foundExcludedMatches = globSync(resolvedDynamicExcludeGlob, { cwd: projectPath, absolute: true, nodir: true });
                    }
                }
                catch (e) {
                    options?.logger?.warn(`[Dynamic Exclude] Error globbing exclude pattern ${resolvedDynamicExcludeGlob}: ${e.message}`);
                }
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
    }
    else {
        filesSurvivingPrimaryDynamicExclude = new Set(allInitialInputFiles);
    }
    const finalCandidates = new Set(filesSurvivingPrimaryDynamicExclude);
    if (options && typeof options.globExtension === 'string' && options.globExtension.trim() !== '') {
        let patternFromPresetOrCustom = options.globExtension;
        if (globExtensionPresets.has(options.globExtension)) {
            patternFromPresetOrCustom = globExtensionPresets.get(options.globExtension);
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
        if (staticCheckResult.length === 0) {
            return false;
        }
        return true;
    });
    return { files: trulyFinalFiles.map(f => forward_slash(f)), webUrls };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9nbG9iLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQ2pDLE9BQU8sRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFDOUMsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUNwRCxPQUFPLEVBQUUsVUFBVSxJQUFJLE1BQU0sRUFBRSxNQUFNLHNCQUFzQixDQUFBO0FBQzNELE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDM0UsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxNQUFNLENBQUE7QUFDekMsT0FBTyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUU1RCxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFHaEQsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHO0lBQzNCLE1BQU07SUFDTixNQUFNO0lBQ04sSUFBSSxFQUFFLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksR0FBRyxhQUFhO0NBQ3BFLENBQUM7QUFFRixNQUFNLFlBQVksR0FBRyxDQUFDLFNBQWlCLEVBQUUsVUFBa0IsRUFBVyxFQUFFO0lBQ3BFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3RELE9BQU8sT0FBTyxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FB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