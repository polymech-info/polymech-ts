import * as path from 'path';
import pMap from 'p-map';
import pkg from 'which';
const { sync: which } = pkg;
import { resolve, OSR_CACHE } from '@polymech/commons';
import { dirname, equalFiles, swProcMessage } from './sw-util.js';
import { reportCSV } from '../report/csv.js';
import { logger, substitute } from '../index.js';
import { removeEmpty } from '../lib/index.js';
import { Helper } from '../lib/process/index.js';
import { sync as exists } from "@polymech/fs/exists";
import { sync as read } from "@polymech/fs/read";
import { sync as write } from "@polymech/fs/write";
import { sync as dir } from "@polymech/fs/dir";
import { sync as rm } from "@polymech/fs/remove";
import { deepClone as clone } from "@polymech/core/objects";
import { swRayTraceRenderQuality_e } from './sw-types.js';
import { get_cached, get_path_cached, set_cached } from '@polymech/cache';
import { MODULE_NAME, MSG_FAILED_TO_LOAD } from '../constants.js';
import { closeAppByName, fileAsBuffer, getSWBin } from './sw-util.js';
export const convertFile = async (src, target, view, onNode = () => { }, options, configuration) => {
    configuration = options.configuration || configuration;
    options.close && closeAppByName('SLDWORKS');
    const osr_cache = OSR_CACHE();
    let cache_key_obj = {
        sw: options.sw,
        src,
        target,
        configuration
    };
    if (target.endsWith('.jpg')) {
        cache_key_obj =
            {
                ...cache_key_obj,
                quality: options.quality,
                width: options.width,
                height: options.height,
                renderer: options.renderer
            };
    }
    if (target.endsWith('.xlsx')) {
        cache_key_obj = {
            ...cache_key_obj,
            "bom-config": options['bom-config'],
            "bom-detail": options['bom-detail'],
            "bom-template": options['bom-template'],
            "bom-type": options['bom-type'],
            "bom-images": options['bom-images'],
        };
    }
    const ca_options = JSON.parse(JSON.stringify(removeEmpty(cache_key_obj)));
    let cached = await get_cached(src, ca_options, MODULE_NAME);
    const cachedPath = await get_path_cached(src, ca_options, MODULE_NAME);
    if (!exists(target)) {
        cached = null;
    }
    if (osr_cache && cached && cachedPath && options.cache == true) {
        if (!exists(target) || !equalFiles(target, cachedPath)) {
            write(target, Buffer.from(cached));
        }
        logger.debug(`[${MODULE_NAME}] Skipping conversion of ${src} to ${target}`);
        await onNode({ src, target, options });
        return Promise.resolve();
    }
    const parts = path.parse(target);
    const source_parts = path.parse(src);
    let exe = '' + options.script;
    let cwd = getSWBin(options.sw);
    let _target = '' + target;
    let onPost = null;
    // SW Photoview wont render correctly in hidden mode
    if (parts.ext === '.jpg' && source_parts.ext.toLowerCase() === '.sldasm' && options.renderer.toLowerCase() === '    ') {
        logger.debug(`[${MODULE_NAME}] Converting ${src} to ${target} : - Photoview: - ` + options.hidden);
        options.hidden = "false";
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
    ];
    if (options.save)
        args.push(`--save`);
    if (options.pack)
        args.push(`--pack`);
    if (options.rebuild)
        args.push(`--rebuild`);
    if (options.light)
        args.push(`--light`);
    if (options.write)
        args.push(`--write`);
    if (parts.ext === '.json' && source_parts.ext.toLowerCase() === '.sldasm') {
        exe = 'model-reader.exe';
        args = [
            `--source="${path.resolve(src)}"`,
            `--target="${_target}"`
        ];
        onPost = () => {
            try {
                let props = read(_target, 'json');
                if (!props) {
                    logger.error('Error reading model file ', src);
                    return false;
                }
                props = props.map(removeEmpty);
                write(_target, props);
                return true;
            }
            catch (e) {
                logger.error(`Error executing model-reader::onPost for ${src} to ${_target}`);
                write(_target, {});
                return false;
            }
        };
    }
    if (parts.base.endsWith('-configs.json') && source_parts.ext.toLowerCase() === '.sldasm') {
        exe = 'getconfigs.exe';
        args = [
            `--source="${path.resolve(src)}"`,
            `--target="${path.resolve(_target)}"`
        ];
        onPost = () => {
            try {
                let props = read(_target, 'json');
                if (!props) {
                    logger.error('Error reading configurations file ', src);
                    return false;
                }
                return true;
            }
            catch (e) {
                logger.error(`Error executing get::onPost for ${src} to ${_target}`);
                write(_target, {});
                return false;
            }
        };
    }
    if (parts.ext === '.html') {
        exe = 'ExportHTML.exe';
        if (!configuration || configuration === 'Default') {
            args = [
                `"${src}"`,
                `"${target}"`,
            ];
        }
        else if (configuration) {
            //EDrawings Control doesnt support configurations directly, we need a configuration specific edrawings file exported instead
            const eDrawingsFile = src.toLowerCase().replace('.sldasm', `-${configuration}.EASM`);
            if (!exists(eDrawingsFile)) {
                logger.error(`Configuration specific edrawing file ${eDrawingsFile} doesnt exists`);
                return Promise.resolve();
            }
            args = [
                `"${eDrawingsFile}"`,
                `"${target}"`,
                `${configuration}`
            ];
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
        ];
        options['bom-images'] && args.push('--images');
        options['bom-template'] && args.push(`--template ${options['bom-template']}`);
        if (!options.cache && exists(target)) {
            rm(target);
        }
    }
    if (source_parts.ext === '.drawio') {
        exe = 'draw.io.exe';
        try {
            cwd = path.parse(which(exe)).dir;
        }
        catch (e) {
            logger.error(`Cant find ${exe}`);
            return Promise.resolve();
        }
        args = [
            `"${src}"`,
            '-x',
            `-f ${parts.ext.replace('.', '')}`,
            `${options.args}`
        ];
    }
    const bin = path.resolve(`${cwd}/${exe}`);
    if (!exists(bin)) {
        logger.error(`${bin} doesnt exists in ${cwd}`);
        logger.error('__dirname:' + dirname());
        logger.error('options.sw ' + options.sw);
        return;
    }
    const ret = await Helper.run(cwd, exe, args, options.debug);
    ret.messages = [...new Set(ret.messages)];
    const failed = !!ret.messages.find((m) => m.includes(MSG_FAILED_TO_LOAD));
    ret.messages = ret.messages.map((m) => swProcMessage(m)).filter(x => x != null).map(x => x.message);
    const info = {
        ...ret,
        src,
        target,
        failed: failed,
        options
    };
    await onNode(info);
    onPost && onPost();
    if (info.failed) {
        rm(_target);
        return ret;
    }
    osr_cache && options.cache == true && await set_cached(src, ca_options, MODULE_NAME, fileAsBuffer(_target));
    options.close && closeAppByName('SLDWORKS');
    return ret;
};
export async function convertFiles(file, targets, view, onNode = () => { }, options) {
    if (options.dry) {
        logger.info(`Dry run convert ${file} to `, targets.map((t) => { `\n\t${t}`; }).join(',\n'));
        return Promise.resolve();
    }
    return pMap(targets, (target) => {
        return convertFile(file, target.target, view, onNode, options, target.configuration);
    }, { concurrency: 1 });
}
export const report = (data, dst) => {
    let report = null;
    if (dst.endsWith('.md')) {
        //report = reportMarkdown(data)
    }
    if (dst.endsWith('.csv')) {
        report = reportCSV(data);
    }
    logger.info(`Write report to ${dst}`);
    report = write(dst, data);
    return report;
};
export const targets = (f, options) => {
    const srcParts = path.parse(f);
    const variables = clone(options.variables);
    const targets = [];
    let configurations = { "Default": null };
    if (options.configuration && options.configuration !== 'Default') {
        configurations[options.configuration] = null;
        delete configurations["Default"];
    }
    if (options.dstInfo.PATH.includes('{CONFIGURATION}') &&
        srcParts.ext.toLowerCase() === '.sldasm') {
        const configurationsFile = `${srcParts.dir}/${srcParts.name}-configs.json`;
        if (exists(configurationsFile)) {
            try {
                configurations = read(configurationsFile, 'json');
            }
            catch (error) {
                logger.error(`Error reading configurations file ${configurationsFile}`);
            }
        }
    }
    for (const conf in configurations) {
        if (options.dstInfo.IS_GLOB) {
            options.dstInfo.GLOB_EXTENSIONS.forEach((e) => {
                variables.SRC_NAME = srcParts.name;
                variables.SRC_DIR = srcParts.dir;
                variables.CONFIGURATION = conf;
                let targetPath = substitute(options.variables.DST_PATH, options.alt, variables);
                targetPath = path.resolve(targetPath.replace(options.variables.DST_FILE_EXT, '') + e);
                const parts = path.parse(targetPath);
                if (srcParts.ext === parts.ext) {
                    return;
                }
                if (!exists(parts.dir)) {
                    try {
                        dir(parts.dir);
                    }
                    catch (e) {
                        if (options.debug) {
                            logger.error(`Error creating target path ${parts.dir} for ${targetPath}`);
                        }
                        return;
                    }
                }
                targets.push({
                    target: targetPath,
                    configuration: conf
                });
            });
        }
        else {
            variables.SRC_NAME = srcParts.name;
            variables.SRC_DIR = srcParts.dir;
            variables.CONFIGURATION = conf;
            let targetPath = substitute(options.variables.DST_PATH, options.alt, variables);
            if (!exists(targetPath)) {
                try {
                    dir(targetPath);
                }
                catch (e) {
                    if (options.debug) {
                        logger.error(`Error creating target path ${targetPath}`);
                    }
                    return;
                }
            }
            targets.push({
                target: targetPath,
                configuration: conf
            });
        }
    }
    return targets;
};
export async function convert(options) {
    logger.setSettings({ minLevel: options.logLevel || 'warn' });
    let reports = [];
    const onNode = options.onNode || ((data) => reports.push(data));
    if (options.srcInfo.FILES.length === 0) {
        logger.warn(`No files found to convert : `, options.src);
        return;
    }
    //skip orphan / temporary files
    options.srcInfo.FILES = options.srcInfo.FILES.filter((f) => {
        return f.includes('~$') === false;
    });
    const ret = await pMap(options.srcInfo.FILES, async (f) => {
        const outputs = targets(f, options);
        logger.info(`Convert ${f} to ${outputs.map(t => t.target).join(',')}`);
        return convertFiles(f, outputs, options.view, onNode, options);
    }, { concurrency: 1 });
    if (options.report) {
        const reportOutFile = path.resolve(resolve(options.report, false, {
            dst: options.srcInfo.DIR,
            ...options.variables,
            CONFIGURATION: options.configuration || ''
        }));
        logger.debug(`Write report to ${reportOutFile}`);
        report(reports, reportOutFile);
    }
    return ret;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ctY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jYWQvc3ctY29udmVydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQTtBQUM1QixPQUFPLElBQUksTUFBTSxPQUFPLENBQUE7QUFDeEIsT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDO0FBQ3hCLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQzVCLE9BQU8sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDdEQsT0FBTyxFQUFFLE9BQU8sRUFBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLE1BQU0sY0FBYyxDQUFBO0FBQ2hFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUM1QyxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFFN0MsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLHlCQUF5QixDQUFBO0FBRWhELE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDcEQsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsSUFBSSxJQUFJLEtBQUssRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQ2xELE9BQU8sRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFFOUMsT0FBTyxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsU0FBUyxJQUFJLEtBQUssRUFBRSxNQUFNLHdCQUF3QixDQUFBO0FBRTNELE9BQU8sRUFBRSx5QkFBeUIs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