import * as path from 'node:path'
import * as fs from 'node:fs'
import { isString, isArray } from '@polymech/core/primitives'
import pMap from 'p-map'
import { hasMagic } from 'glob'
import { sync as exists } from '@polymech/fs/exists'
import { forward_slash, resolve, pathInfoEx } from '@polymech/commons'

import { IKBotTask } from '../ai-tools/index.js'
import { OptionsSchema } from '../zod_schema.js'
import { transcribe } from '../lib/transcribe.js'
import { isWebUrl } from '../glob.js'

import { getLogger } from '../index.js'
import { variables } from '../variables.js'

export const default_sort = (files: string[]): string[] => {
    const getSortableParts = (filename: string) => {
        const baseName = path.parse(filename).name;
        const match = baseName.match(/^(\d+)_?(.*)$/); // Match leading numbers
        const numPart = match ? parseInt(match[1], 10) : NaN;
        const textPart = match ? match[2] : baseName; // Extract text part
  
        return { numPart, textPart };
    }
    return files.sort((a, b) => {
        const { numPart: aNum, textPart: aText } = getSortableParts(a)
        const { numPart: bNum, textPart: bText } = getSortableParts(b)
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum || aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' })
        }
        return aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' })
    })
  }

export const TranscribeOptionsSchema = () => {
    return OptionsSchema().pick({
        include: true,
        dst: true,
        api_key: true,
        model: true,
        router: true,
        logLevel: true,
        config: true,
        baseURL: true,
        alt: true,
        variables: true,
        profile: true,
        env: true,
    }).passthrough()
}

function extractPaths(input: string): string[] {
    if (isWebUrl(input)) {
        return [input]
    }
    if (exists(path.resolve(resolve(input)))) {
        return [input]
    }
    if (hasMagic(input)) {
        return [input]
    }
    const pathStartRegex = /([A-Za-z]:\\)|\/|(https?:\/\/)/g;
    const matchIndices: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = pathStartRegex.exec(input)) !== null) {
        matchIndices.push(match.index);
    }
    if (!matchIndices.length) {
        return [];
    }
    const paths: string[] = [];
    for (let i = 0; i < matchIndices.length; i++) {
        const start = matchIndices[i];
        const end = i < matchIndices.length - 1 ? matchIndices[i + 1] : input.length;
        const pathStr = input.substring(start, end).trim();
        if (pathStr) {
            paths.push(pathStr);
        }
    }
    return paths;
}

function flattenArrays<T>(arrays: T[][]): T[] {
    return arrays.reduce((accumulator, current) => {
        return accumulator.concat(current);
    }, [] as T[]);
}

export const transcribeCommand = async (opts: IKBotTask) => {
    opts.logger = getLogger(opts)

    if (opts.include) {
        if (isString(opts.include)) {
            opts.include = [opts.include]
        }
        if (isArray(opts.include)) {
            const specialPatterns = opts.include.filter((p: string) => hasMagic(p) || isWebUrl(p))
            const normalPaths = opts.include.filter((p: string) => !hasMagic(p) && !isWebUrl(p))
            const processedPaths = flattenArrays(normalPaths.map(extractPaths))
            opts.include = [...specialPatterns, ...processedPaths]
        }
    } else {
        opts.include = []
    }
    
    let files: string[] = []
    for (const includePath of opts.include) {
        if (hasMagic(includePath)) {
            const info = pathInfoEx(forward_slash(path.resolve(resolve(includePath))), false, {
                absolute: true,
            })
            files.push(...info.FILES)
        } else if (exists(includePath)) {
            files.push(includePath)
        }
    }

    if (files.length === 0) {
        opts.logger.warn(`No files found for --include patterns: ${opts.include.join(', ')}`)
        return
    }

    files = default_sort(files)

    opts.logger.info(`Found ${files.length} files to transcribe.`)

    const mapper = async (file: string) => {
        const fileInfo = path.parse(file)
        const CWD = process.cwd()
        const current_variables = {
            ...variables(opts),
            ...opts.variables,
            SRC_PATH: file,
            SRC_NAME: fileInfo.name,
            SRC_EXT: fileInfo.ext,
            SRC_DIR: fileInfo.dir,
            CWD: CWD
        }

        const itemOpts: IKBotTask = {
            ...opts,
            include: [file],
            variables: current_variables
        };
        opts.logger.info(`Transcribing ${file}...`)
        const transcribedText = await transcribe(itemOpts)
        return { transcribedText, itemOpts }
    };

    const results = await pMap(files, mapper, { concurrency: 1 });

    let resolvedDstPath: string | undefined;
    if (opts.dst) {
        resolvedDstPath = path.resolve(resolve(opts.dst, opts.alt, opts.variables));
        if (fs.existsSync(resolvedDstPath)) {
            fs.unlinkSync(resolvedDstPath);
        }
        const allText = results.map(r => r.transcribedText).filter(Boolean).join('\n\n')
        if (allText) {
            fs.writeFileSync(resolvedDstPath, allText + '\n');
            opts.logger.info(`Wrote all transcriptions to ${resolvedDstPath}`);
        }
    } else {
        for (const { transcribedText, itemOpts } of results) {
            if (transcribedText) {
                const defaultDstTemplate = '${SRC_DIR}/${SRC_NAME}.md';
                const defaultDstPath = path.resolve(resolve(defaultDstTemplate, itemOpts.alt, itemOpts.variables));
                fs.writeFileSync(defaultDstPath, transcribedText);
                opts.logger.info(`Output will be saved to ${defaultDstPath}`);
            }
        }
    }
}
