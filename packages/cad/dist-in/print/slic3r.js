import * as path from 'path';
import { logger, substitute } from '../index.js';
import { removeEmpty } from '../lib/index.js';
import { OSR_CACHE } from '@polymech/commons';
import { sync as exists } from "@polymech/fs/exists";
import { sync as read } from "@polymech/fs/read";
import { sync as write } from "@polymech/fs/write";
import { sync as dir } from "@polymech/fs/dir";
import { sync as which } from 'which';
import * as md5 from 'md5';
import pMap from 'p-map';
import { Helper } from '../lib/process/index.js';
import { reportCSV } from '../report/csv.js';
import { get_cached, set_cached } from '@polymech/cache';
import { MODULE_NAME } from '../constants.js';
export const fileAsBuffer = (path) => read(path, 'buffer') || Buffer.from("-");
const SLIC3R_EXE = 'Slic3r-console.exe';
const clone = (obj) => {
    if (null == obj || "object" != typeof obj)
        return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr))
            copy[attr] = obj[attr];
    }
    return copy;
};
export const getSlicrDir = (options) => {
    const dir = path.parse(which(SLIC3R_EXE)).dir;
    if (exists(dir)) {
        return dir;
    }
};
export const getBin = (options) => {
    const dir = getSlicrDir(options);
    const exe = path.resolve(path.join(dir, SLIC3R_EXE));
    if (exists(exe)) {
        return exe;
    }
};
const toPercentString = (aNumber) => String(aNumber * 100) + '%';
export const convertFile = async (file, target, onNode = () => { }, options) => {
    let bin = getBin(options);
    if (!bin) {
        logger.error(`Cant find Slicr. Please register the directory in your $PATH environment variable!`);
        return;
    }
    const getArgs = (o) => {
        return [
            `--output "${target}"`,
            // Non-slicing actions
            o.repair ? '--repair' : '',
            o.cut ? '--cut' : '',
            o.split ? '--split' : '',
            o.info ? '--info' : '',
            '--threads ' + o.threads,
            // Output options
            o.outputFilenameFormat ?
                '--output-filename-format ' + o.outputFilenameFormat : '',
            o.postProcess ? o.postProcessScripts.map(function (script) {
                return '--post-process ' + script;
            }).join(' ') : '',
            o.exportSvg ? '--export-svg' : '',
            o.merge ? '--merge' : '',
            // Printer options
            '--nozzle-diameter ' + o.nozzleDiameter,
            '--print-center ' + o.printCenter.x + ',' + o.printCenter.y,
            '--z-offset ' + o.zOffset,
            '--gcode-flavor ' + o.GCodeFlavor,
            o.useRelativeEDistances ? '--use-relative-e-distances ' : '',
            o.useFirmwareRetraction ? '--use-firmware-retraction ' : '',
            o.useVolumetricE ? '--use-volumetric-e ' : '',
            o.GCodeArcs ? '--gcode-arcs' : '',
            o.g0 ? '--g0' : '',
            o.GCodeComments ? '--gcode-comments' : '',
            '--vibration-limit ' + o.vibrationLimit,
            //'--pressure-advance ' + o.pressureAdvance,
            // Filament options
            '--filament-diameter ' + o.filamentDiameter,
            '--extrusion-multiplier ' + o.extrusionMultiplier,
            '--temperature ' + o.temperature,
            '--first-layer-temperature ' + o.firstLayerTemperature,
            '--bed-temperature ' + o.bedTemperature,
            '--first-layer-bed-temperature ' + o.firstLayerBedTemperature,
            // Speed options
            '--travel-speed ' + o.travelSpeed,
            '--perimeter-speed ' + o.perimeterSpeed,
            '--small-perimeter-speed ' + o.smallPerimeterSpeed,
            '--external-perimeter-speed ' + o.externalPerimeterSpeed,
            '--infill-speed ' + o.infillSpeed,
            '--solid-infill-speed ' + o.solidInfillSpeed,
            '--top-solid-infill-speed ' + o.topSolidInfillSpeed,
            '--support-material-speed ' + o.supportMaterialSpeed,
            '--support-material-interface-speed ' + o.supportMaterialInterfaceSpeed,
            '--bridge-speed ' + o.bridgeSpeed,
            '--gap-fill-speed ' + o.gapFillSpeed,
            '--first-layer-speed ' + o.firstLayerSpeed,
            // Accelerator options
            '--perimeter-acceleration ' + o.perimeterAcceleration,
            '--infill-acceleration ' + o.infillAcceleration,
            '--bridge-acceleration ' + o.bridgeAcceleration,
            '--first-layer-acceleration ' + o.firstLayerAcceleration,
            '--default-acceleration ' + o.defaultAcceleration,
            // Accuracy options
            '--layer-height ' + o.layerHeight,
            '--first-layer-height ' + o.firstLayerHeight,
            '--infill-every-layers ' + o.infillEveryLayers,
            '--solid-infill-every-layers ' + o.solidInfillEveryLayers,
            // Print Options
            '--perimeters ' + o.perimeters,
            '--top-solid-layers ' + o.topSolidLayers,
            '--bottom-solid-layers ' + o.bottomSolidLayers,
            o.solidLayers ? '--solid-layers' : '',
            '--fill-density ' + toPercentString(o.fillDensity),
            '--fill-angle ' + o.fillAngle,
            '--fill-pattern ' + o.fillPattern,
            '--solid-fill-pattern ' + o.solidFillPattern,
            o.startGcode ? '--start-gcode' : '',
            o.endGcode ? '--end-gcode ' : '',
            o.layerGcode ? '--layer-gcode ' : '',
            o.toolchangeGcode ? '--toolchange-gcode ' : '',
            '--seam-position ' + o.seamPosition,
            o.externalPerimetersFirst ? '--external-perimeters-first ' : '',
            o.spiralVase ? '--spiral-vase ' : '',
            o.onlyRetractWhenCrossingPerimeters ?
                '--only-retract-when-crossing-perimeters ' : '',
            '--solid-infill-below-area ' + o.solidInfillBelowArea,
            o.infillOnlyWhereNeeded ? '--infill-only-where-needed ' : '',
            o.infillFirst ? '--infill-first ' : '',
            // Quality options
            o.extraPerimeters ? '--extra-perimeters' : '',
            o.avoidCrossingPerimeters ? '--avoid-crossing-perimeters' : '',
            o.thinWalls ? '--thin-walls' : '',
            o.overhangs ? '--overhangs' : '',
            // Support material options
            o.supportMaterial ? '--support-material ' : '',
            '--support-material-threshold ' + o.supportMaterialThreshold,
            '--support-material-pattern ' + o.supportMaterialPattern,
            '--support-material-spacing ' + o.supportMaterialSpacing,
            '--support-material-angle ' + o.supportMaterialAngle,
            '--support-material-interface-layers ' +
                o.supportMaterialInterfaceLayers,
            '--support-material-interface-spacing ' +
                o.supportMaterialInterfaceSpacing,
            '--raft-layers ' + o.raftLayers,
            '--support-material-enforce-layers ' + o.supportMaterialEnforceLayers,
            o.dontSupportBridges ? '--dont-support-bridges ' : '',
            // Retraction options
            '--retract-length ' + o.retractLength,
            '--retract-speed ' + o.retractSpeed,
            '--retract-restart-extra ' + o.retractRestartExtra,
            '--retract-before-travel ' + o.retractBeforeTravel,
            '--retract-lift ' + o.retractLift,
            o.retractLayerChange ? '--retract-layer-change' : '',
            o.wipe ? '--wipe' : '',
            // Retraction options for multi-extruder setups
            '--retract-length-toolchange ' + o.retractLengthToolchange,
            '--retract-restart-extra-toolchange ' + o.retractRestartExtraToolchange,
            // Cooling options
            o.cooling ? '--cooling ' : ' ',
            '--min-fan-speed ' + (o.minFanSpeed * 100), // in %
            '--max-fan-speed ' + (o.maxFanSpeed * 100), // in %
            '--bridge-fan-speed ' + (o.bridgeFanSpeed * 100), // in %
            '--fan-below-layer-time ' + o.fanBelowLayerTime,
            '--slowdown-below-layer-time ' + o.slowdownBelowLayerTime,
            '--min-print-speed ' + o.minPrintSpeed,
            '--disable-fan-first-layers ' + o.disableFanFirstLayers,
            o.fanAlwaysOn ? '--fan-always-on ' : '',
            // Skirt options
            '--skirts ' + o.skirts,
            '--skirt-distance ' + o.skirtDistance,
            '--skirt-height ' + o.skirtHeight,
            '--min-skirt-length ' + o.minSkirtLength,
            '--brim-width ' + o.brimWidth,
            // Transform options
            '--scale ' + o.scale,
            '--rotate ' + o.rotate,
            '--duplicate ' + o.duplicate,
            '--duplicate-grid ' + o.duplicateGrid,
            '--duplicate-distance ' + o.duplicateDistance,
            //'--xy-size-compensation ' + o.xySizeCompensation,
            // Sequential printing options
            o.completeObjects ? '--complete-objects ' : '',
            '--extruder-clearance-radius ' + o.extruderClearanceRadius,
            '--extruder-clearance-height ' + o.extruderClearanceHeight,
            // Miscellaneous options:
            o.notes ? '--notes ' + o.notes : '',
            '--resolution ' + o.resolution,
            // '--bed-size ' + o.bedSize.width + ',' + o.bedSize.height,
            // Flow options (advanced):
            '--extrusion-width ' + o.extrusionWidth,
            o.firstLayerExtrusionWidth ?
                '--first-layer-extrusion-width ' + o.firstLayerExtrusionWidth : '',
            '--perimeter-extrusion-width ' + o.perimeterExtrusionWidth,
            //'--external-perimeter-extrusion-width ' +
            //  o.externalPerimeterExtrusionWidth,
            '--infill-extrusion-width ' + o.infillExtrusionWidth,
            '--solid-infill-extrusion-width ' + o.solidInfillExtrusionWidth,
            '--top-infill-extrusion-width ' + o.topInfillExtrusionWidth,
            '--support-material-extrusion-width ' + o.supportMaterialExtrusionWidth,
            '--bridge-flow-ratio ' + o.bridgeFlowRatio,
            // Multiple extruder options:
            o.extruderOffset.x || o.extruderOffset.y ?
                '--extruder-offset ' + o.extruderOffset.x + 'x' +
                    o.extruderOffset.y : '',
            '--perimeter-extruder ' + o.perimeterExtruder,
            '--infill-extruder ' + o.infillExtruder,
            //'--solid-infill-extruder ' + o.solidInfillExtruder,
            '--support-material-extruder ' + o.supportMaterialExtruder,
            '--support-material-interface-extruder ' +
                o.supportMaterialInterfaceExtruder,
            o.oozePrevention ? '--ooze-prevention ' : '',
            '--standby-temperature-delta ' + o.standbyTemperatureDelta,
            `"${file}"`
        ];
    };
    const osr_cache = OSR_CACHE();
    const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }));
    const cached = await get_cached(file, ca_options, MODULE_NAME);
    if (osr_cache && cached && options.cache !== false) {
        let md5Src = md5(Buffer.from(cached));
        let md5Dst = md5(fileAsBuffer(target));
        if (!exists(target) || md5Src !== md5Dst) {
            write(target, Buffer.from(cached));
        }
        onNode({
            src: file,
            target
        });
        return Promise.resolve();
    }
    let _target = '' + target;
    let args = getArgs(options).filter((a) => !!a).filter((k) => k.indexOf('undefined') == -1);
    const ret = await Helper.run(getSlicrDir(options), SLIC3R_EXE, args, options.debug);
    if (ret && ret.code !== 0) {
        logger.error(`Error running Slic3r : `);
        return ret;
    }
    if (options.log) {
        write(options.log, ret.messages.join('\n'));
    }
    onNode({
        ...ret,
        src: file,
        target
    });
    if (options.saveArgs) {
        write(options.saveArgs, `${SLIC3R_EXE} ${args.join(' ')}`);
    }
    if (options.saveAsProfile) {
        const out = clone(removeEmpty(options));
        delete out['src'];
        delete out['srcInfo'];
        delete out['dst'];
        delete out['dstInfo'];
        delete out['title'];
        delete out['type'];
        delete out['properties'];
        delete out['oneOf'];
        delete out['$0'];
        delete out['_'];
        delete out['skip'];
        delete out['variables'];
        delete out['saveAsProfile'];
        delete out['saveArgs'];
        delete out['profile'];
        delete out['debug'];
        delete out['verbose'];
        delete out['log'];
        write(options.saveAsProfile, out);
    }
    if (osr_cache) {
        options.debug && logger.info('Write output to cache', _target);
        await set_cached(file, ca_options, MODULE_NAME, fileAsBuffer(_target));
    }
    return ret;
};
export async function convertFiles(file, targets, onNode = () => { }, options) {
    if (options.dry) {
        return Promise.resolve();
    }
    return pMap(targets, (target) => {
        return convertFile(file, target, onNode, options);
    }, { concurrency: 1 });
}
export const report = (data, dst) => {
    let report = null;
    if (dst.endsWith('.csv')) {
        report = reportCSV(data);
    }
    if (report) {
        logger.info(`Write report to ${dst}`);
        write(dst, report);
    }
    return report;
};
export const targets = (f, options) => {
    const srcParts = path.parse(f);
    const variables = clone(options.variables);
    const targets = [];
    if (options.dstInfo.IS_GLOB) {
        options.dstInfo.GLOB_EXTENSIONS.forEach((e) => {
            variables.SRC_NAME = srcParts.name;
            variables.SRC_DIR = srcParts.dir;
            let targetPath = substitute(options.variables.DST_PATH, options.alt, variables);
            targetPath = path.resolve(targetPath.replace(options.variables.DST_FILE_EXT, '') + e);
            const parts = path.parse(targetPath);
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
            targets.push(targetPath);
        });
    }
    return targets;
};
export async function convert(options) {
    let reports = [];
    const onNode = options.onNode || ((data) => reports.push(data));
    options.verbose && logger.info(`Convert ${options.srcInfo.FILES.length} files `);
    await pMap(options.srcInfo.FILES, (f) => {
        const outputs = targets(f, options);
        options.verbose && logger.info(`Convert ${f} to `, outputs);
        return convertFiles(f, outputs, onNode, options);
    }, { concurrency: 1 });
    if (options.report) {
        const reportOutFile = substitute(options.report, false, {
            dst: options.srcInfo.DIR
        });
        options.verbose && logger.info(`Write report to ${reportOutFile}`);
        report(reports, reportOutFile);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2xpYzNyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3ByaW50L3NsaWMzci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQTtBQUM1QixPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsV0FBVyxFQUFHLE1BQU0saUJBQWlCLENBQUE7QUFDOUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQzdDLE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDcEQsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsSUFBSSxJQUFJLEtBQUssRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQ2xELE9BQU8sRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFDOUMsT0FBTyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsTUFBTSxPQUFPLENBQUE7QUFDckMsT0FBTyxLQUFLLEdBQUcsTUFBTSxLQUFLLENBQUE7QUFDMUIsT0FBTyxJQUFJLE1BQU0sT0FBTyxDQUFBO0FBR3hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQTtBQUVoRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFFNUMsT0FBTyxFQUNILFVBQVUsRUFDVixVQUFVLEVBQ2IsTUFBTSxpQkFBaUIsQ0FBQTtBQUV4QixPQUFPLEVBQ0gsV0FBVyxFQUNkLE1BQU0saUJBQWlCLENBQUE7QUFHeEIsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBVyxJQUFJLE1BQU0sQ0FBQyxJQUFJ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