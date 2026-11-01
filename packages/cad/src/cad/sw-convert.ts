import * as path from 'path'
import pMap from 'p-map'
import pkg from 'which';
const { sync: which } = pkg;
import { resolve, OSR_CACHE } from '@polymech/commons'
import { dirname,equalFiles, swProcMessage } from './sw-util.js'
import { reportCSV } from '../report/csv.js'
import { logger, substitute } from '../index.js'
import { removeEmpty } from '../lib/index.js'
import { SolidworkOptions } from '../types.js'
import { Helper } from '../lib/process/index.js'

import { sync as exists } from "@polymech/fs/exists"
import { sync as read } from "@polymech/fs/read"
import { sync as write } from "@polymech/fs/write"
import { sync as dir } from "@polymech/fs/dir"

import { sync as rm } from "@polymech/fs/remove"
import { deepClone as clone } from "@polymech/core/objects"

import { swRayTraceRenderQuality_e, IAssembly, IAssemblyData } from './sw-types.js'
import { get_cached, get_path_cached, get_cache_key, set_cached } from '@polymech/cache'

import {
    MODULE_NAME,
    MSG_FAILED_TO_LOAD
} from '../constants.js'

import { closeAppByName, fileAsBuffer, getSWBin, removeEmptyValues } from './sw-util.js'

export const convertFile = async (
    src,
    target,
    view: string,
    onNode: (data) => void = () => { },
    options: SolidworkOptions,
    configuration: string) => {
    configuration = options.configuration || configuration
    options.close && closeAppByName('SLDWORKS')
    const osr_cache = OSR_CACHE()
    let cache_key_obj: any = {
        sw: options.sw,
        src,
        target,
        configuration
    }
    if (target.endsWith('.jpg')) {
        cache_key_obj =
        {
            ...cache_key_obj,
            quality: options.quality,
            width: options.width,
            height: options.height,
            renderer: options.renderer
        }
    }
    if (target.endsWith('.xlsx')) {
        cache_key_obj = {
            ...cache_key_obj,
            "bom-config": options['bom-config'],
            "bom-detail": options['bom-detail'],
            "bom-template": options['bom-template'],
            "bom-type": options['bom-type'],
            "bom-images": options['bom-images'],
        }
    }
    const ca_options = JSON.parse(JSON.stringify(removeEmpty(cache_key_obj)))
    let cached = await get_cached(src, ca_options, MODULE_NAME)
    const cachedPath = await get_path_cached(src, ca_options, MODULE_NAME)
    if (!exists(target)) {
        cached = null;
    }
    if (osr_cache && cached && cachedPath && options.cache == true) {
        if (!exists(target) || !equalFiles(target, cachedPath)) {
            write(target, Buffer.from(cached))
        }
        logger.debug(`[${MODULE_NAME}] Skipping conversion of ${src} to ${target}`)
        await onNode({ src, target, options })
        return Promise.resolve()
    }

    const parts = path.parse(target)
    const source_parts = path.parse(src)
    let exe = '' + options.script
    let cwd = getSWBin(options.sw)
    let _target = '' + target
    let onPost = null

    // SW Photoview wont render correctly in hidden mode
    if (parts.ext === '.jpg' && source_parts.ext.toLowerCase() === '.sldasm' && options.renderer.toLowerCase() === '    ') {
        logger.debug(`[${MODULE_NAME}] Converting ${src} to ${target} : - Photoview: - ` + options.hidden)
        options.hidden = "false"
    }
    let args = [
        `--source="${src}"`,
        `--target="${target}"`,
        `--configuration="${configuration}"`,
        `--view="*${view}"`,
        `--hidden=` + options.hidden || "true",
        `--width=` + options.width,
        `--height=` + options.height,
        `--swv=` + options.swv,
        `--renderer=` + options.renderer.toLowerCase() || "solidworks",
        `--quality=${options.quality || swRayTraceRenderQuality_e.swRenderQuality_Good}`
    ]

    if (options.save) args.push(`--save`)
    if (options.pack) args.push(`--pack`)
    if (options.rebuild) args.push(`--rebuild`)
    if (options.light) args.push(`--light`)
    if (options.write) args.push(`--write`)

    if (parts.ext === '.json' && source_parts.ext.toLowerCase() === '.sldasm') {
        exe = 'model-reader.exe'
        args = [
            `--source="${path.resolve(src)}"`,
            `--target="${_target}"`
        ]
        onPost = () => {
            try {
                let props = read(_target, 'json') as any[];
                if (!props) {
                    logger.error('Error reading model file ', src)
                    return false
                }
                props = props.map(removeEmpty)
                write(_target, props)
                return true
            } catch (e) {
                logger.error(`Error executing model-reader::onPost for ${src} to ${_target}`)
                write(_target, {})
                return false
            }
        }
    }
    if (parts.base.endsWith('-configs.json') && source_parts.ext.toLowerCase() === '.sldasm') {
        exe = 'getconfigs.exe'
        args = [
            `--source="${path.resolve(src)}"`,
            `--target="${path.resolve(_target)}"`
        ]
        onPost = () => {
            try {
                let props = read(_target, 'json') as any[];
                if (!props) {
                    logger.error('Error reading configurations file ', src)
                    return false
                }
                return true
            } catch (e) {
                logger.error(`Error executing get::onPost for ${src} to ${_target}`)
                write(_target, {})
                return false
            }
        }
    }
    if (parts.ext === '.html') {
        exe = 'ExportHTML.exe'
        if (!configuration || configuration === 'Default') {
            args = [
                `"${src}"`,
                `"${target}"`,
            ]
        } else if (configuration) {
            //EDrawings Control doesnt support configurations directly, we need a configuration specific edrawings file exported instead
            const eDrawingsFile = src.toLowerCase().replace('.sldasm', `-${configuration}.EASM`)
            if (!exists(eDrawingsFile)) {
                logger.error(`Configuration specific edrawing file ${eDrawingsFile} doesnt exists`)
                return Promise.resolve()
            }
            args = [
                `"${eDrawingsFile}"`,
                `"${target}"`,
                `${configuration}`
            ]
        }
    }
    if (parts.ext === '.xlsx') {
        exe = 'bom.exe';
        args = [
            `"${src}"`,
            `"${target}"`,
            `--configuration ${options['bom-config']}`,
            `--type ${options['bom-type']}`,
            `--detail ${options['bom-detail']}`
        ]

        options['bom-images'] && args.push('--images')
        options['bom-template'] && args.push(`--template ${options['bom-template']}`)

        if (!options.cache && exists(target)) {
            rm(target);
        }
    }
    if (source_parts.ext === '.drawio') {
        exe = 'draw.io.exe';
        try {
            cwd = path.parse(which(exe)).dir;
        } catch (e) {
            logger.error(`Cant find ${exe}`);
            return Promise.resolve();
        }
        args = [
            `"${src}"`,
            '-x',
            `-f ${parts.ext.replace('.', '')}`,
            `${options.args}`
        ]
    }
    const bin = path.resolve(`${cwd}/${exe}`)
    if (!exists(bin)) {
        logger.error(`${bin} doesnt exists in ${cwd}`)
        logger.error('__dirname:' + dirname())
        logger.error('options.sw ' + options.sw)
        return
    }
    const ret = await Helper.run(cwd, exe, args, options.debug)
    ret.messages = [...new Set(ret.messages)]
    const failed = !!ret.messages.find((m: string) => m.includes(MSG_FAILED_TO_LOAD))
    ret.messages = ret.messages.map((m: string) => swProcMessage(m)).filter(x => x != null).map(x => x.message)
    const info = {
        ...ret,
        src,
        target,
        failed: failed,
        options
    }

    await onNode(info)
    onPost && onPost()
    if (info.failed) {
        rm(_target)
        return ret
    }
    osr_cache && options.cache == true && await set_cached(src, ca_options, MODULE_NAME, fileAsBuffer(_target))
    options.close && closeAppByName('SLDWORKS')
    return ret
}
export async function convertFiles(file, targets: string[], view, onNode: (data: any) => void = () => { }, options: SolidworkOptions) {
    if (options.dry) {
        logger.info(`Dry run convert ${file} to `, targets.map((t) => { `\n\t${t}` }).join(',\n'))
        return Promise.resolve()
    }
    return pMap(targets, (target: any) => {
        return convertFile(file, target.target, view, onNode, options, target.configuration);
    }, { concurrency: 1 })
}
export const report = (data, dst: string) => {

    let report: any = null;
    if (dst.endsWith('.md')) {
        //report = reportMarkdown(data)
    }

    if (dst.endsWith('.csv')) {
        report = reportCSV(data)
    }

    logger.info(`Write report to ${dst}`)
    report = write(dst, data)

    return report;
}
export const targets = (f: string, options: SolidworkOptions) => {
    const srcParts = path.parse(f)
    const variables = clone(options.variables)
    const targets = []

    let configurations: any = { "Default": null }
    if (options.configuration && options.configuration !== 'Default') {
        configurations[options.configuration] = null
        delete configurations["Default"]
    }
    if (options.dstInfo.PATH.includes('{CONFIGURATION}') &&
        srcParts.ext.toLowerCase() === '.sldasm') {
        const configurationsFile = `${srcParts.dir}/${srcParts.name}-configs.json`
        if (exists(configurationsFile)) {
            try {
                configurations = read(configurationsFile, 'json')
            } catch (error) {
                logger.error(`Error reading configurations file ${configurationsFile}`);
            }
        }
    }

    for (const conf in configurations) {
        if (options.dstInfo.IS_GLOB) {
            options.dstInfo.GLOB_EXTENSIONS.forEach((e) => {
                variables.SRC_NAME = srcParts.name
                variables.SRC_DIR = srcParts.dir
                variables.CONFIGURATION = conf
                let targetPath = substitute(options.variables.DST_PATH, options.alt, variables)
                targetPath = path.resolve(targetPath.replace(options.variables.DST_FILE_EXT, '') + e)
                const parts = path.parse(targetPath)
                if (srcParts.ext === parts.ext) {
                    return
                }
                if (!exists(parts.dir)) {
                    try {
                        dir(parts.dir)
                    } catch (e) {
                        if (options.debug) {
                            logger.error(`Error creating target path ${parts.dir} for ${targetPath}`);
                        }
                        return
                    }
                }
                targets.push({
                    target: targetPath,
                    configuration: conf
                })
            })
        } else {
            variables.SRC_NAME = srcParts.name
            variables.SRC_DIR = srcParts.dir
            variables.CONFIGURATION = conf
            let targetPath = substitute(options.variables.DST_PATH, options.alt, variables)
            if (!exists(targetPath)) {
                try {
                    dir(targetPath)
                } catch (e) {
                    if (options.debug) {
                        logger.error(`Error creating target path ${targetPath}`)
                    }
                    return
                }
            }
            targets.push({
                target: targetPath,
                configuration: conf
            })
        }
    }
    return targets
}
export async function convert(options: SolidworkOptions) {
    logger.setSettings({ minLevel: options.logLevel as any || 'warn' })
    let reports = []
    const onNode = options.onNode || ((data) => reports.push(data))
    if (options.srcInfo.FILES.length === 0) {
        logger.warn(`No files found to convert : `, options.src)
        return
    }
    //skip orphan / temporary files
    options.srcInfo.FILES = options.srcInfo.FILES.filter((f) => {
        return f.includes('~$') === false
    })

    const ret = await pMap(options.srcInfo.FILES, async (f) => {
        const outputs = targets(f, options)
        logger.info(`Convert ${f} to ${outputs.map(t => t.target).join(',')}`)
        return convertFiles(f, outputs, options.view, onNode, options)
    }, { concurrency: 1 })

    if (options.report) {
        const reportOutFile: string = path.resolve(resolve(options.report, false, {
            dst: options.srcInfo.DIR,
            ...options.variables,
            CONFIGURATION: options.configuration || ''
        }))
        logger.debug(`Write report to ${reportOutFile}`)
        report(reports, reportOutFile)
    }
    return ret
}
/*
const on3DHTML = (src, dst, options: SolidworkOptions) => {
    const web_root = path.resolve(__dirname + '/../../web/xeo');
    const config = JSON.parse(read(path.resolve(__dirname + '/../../config.json')) as any);
    const templatePath = path.resolve(`${web_root}/template.html`);
    const template = read(templatePath, 'string') as string;

    const srcParts = path.parse(src);
    const variables = {
        ...config.variables,
        SRC_PATH_WEB: './' + srcParts.name + '_3D.html',
        MODEL_SRC: './' + srcParts.name + '.3dxml',
    };

    const content = substitute(false, template, variables);
    write(dst, content);
}
*/