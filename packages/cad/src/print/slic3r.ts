import * as path from 'path'
import { logger, substitute } from '../index.js'
import { removeEmpty  } from '../lib/index.js'
import { OSR_CACHE } from '@polymech/commons'
import { sync as exists } from "@polymech/fs/exists"
import { sync as read } from "@polymech/fs/read"
import { sync as write } from "@polymech/fs/write"
import { sync as dir } from "@polymech/fs/dir"
import { sync as which } from 'which'
import * as md5 from 'md5'
import pMap from 'p-map'

import { SlicerOptions } from '../types.js'
import { Helper } from '../lib/process/index.js'

import { reportCSV } from '../report/csv.js'

import {
    get_cached,
    set_cached
} from '@polymech/cache'

import {
    MODULE_NAME
} from '../constants.js'


export const fileAsBuffer = (path: string) => read(path, 'buffer') as Buffer || Buffer.from("-")

const SLIC3R_EXE = 'Slic3r-console.exe'

const clone = (obj) => {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

export const getSlicrDir = (options: SlicerOptions) => {
    const dir = path.parse(which(SLIC3R_EXE)).dir
    if (exists(dir)) {
        return dir
    }
}

export const getBin = (options: SlicerOptions) => {
    const dir = getSlicrDir(options)
    const exe = path.resolve(path.join(dir, SLIC3R_EXE))
    if (exists(exe)) {
        return exe
    }
}

const toPercentString = (aNumber) => String(aNumber * 100) + '%'

export const convertFile = async (file, target, onNode: (data: any) => void = () => { }, options: SlicerOptions) => {

    let bin = getBin(options)
    if (!bin) {
        logger.error(`Cant find Slicr. Please register the directory in your $PATH environment variable!`)
        return
    }

    const getArgs = (o: SlicerOptions) => {
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
                return '--post-process ' + script
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
        ]
    }

    const osr_cache = OSR_CACHE()
    const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }))

    const cached = await get_cached(file, ca_options, MODULE_NAME)

    if (osr_cache && cached && options.cache !== false) {
        let md5Src = md5(Buffer.from(cached))
        let md5Dst = md5(fileAsBuffer(target))

        if (!exists(target) || md5Src !== md5Dst) {
            write(target, Buffer.from(cached))
        }
        onNode({
            src: file,
            target
        })
        return Promise.resolve()
    }

    let _target = '' + target
    let args = getArgs(options).filter((a)=>!!a).filter((k)=>k.indexOf('undefined')==-1)
    
    const ret = await Helper.run(getSlicrDir(options), SLIC3R_EXE, args, options.debug)

    if(ret && ret.code !==0){
        logger.error(`Error running Slic3r : `)
        return ret
    }

    if(options.log){
        write(options.log,ret.messages.join('\n'))
    }

    onNode({
        ...ret,
        src: file,
        target
    })

    if(options.saveArgs){
        write(options.saveArgs,`${SLIC3R_EXE} ${args.join(' ')}`)    
    }

    if(options.saveAsProfile){
        const out = clone(removeEmpty(options))
        delete out['src']
        delete out['srcInfo']
        delete out['dst']
        delete out['dstInfo']
        delete out['title']
        delete out['type']
        delete out['properties']
        delete out['oneOf']
        delete out['$0']
        delete out['_']
        delete out['skip']
        delete out['variables']
        delete out['saveAsProfile']
        delete out['saveArgs']
        delete out['profile']
        delete out['debug']
        delete out['verbose']
        delete out['log']
        write(options.saveAsProfile, out )
    }

    if (osr_cache) {
        options.debug && logger.info('Write output to cache', _target)
        await set_cached(file, ca_options, MODULE_NAME, fileAsBuffer(_target))
    }

    return ret
}

export async function convertFiles(file, targets: string[], onNode: (data: any) => void = () => { }, options: SlicerOptions) {
    if (options.dry) {
        return Promise.resolve()
    }
    return pMap(targets,(target) => {
        return convertFile(file, target, onNode, options)
    }, { concurrency: 1 });

}

export const report = (data, dst: string) => {

    let report: any = null;
    if (dst.endsWith('.csv')) {
        report = reportCSV(data);
    }
    if (report) {
        logger.info(`Write report to ${dst}`);
        write(dst, report);
    }
    return report;
}

export const targets = (f: string, options: SlicerOptions) => {
    const srcParts = path.parse(f)
    const variables = clone(options.variables)
    const targets = []
    if (options.dstInfo.IS_GLOB) {
        options.dstInfo.GLOB_EXTENSIONS.forEach((e) => {
            variables.SRC_NAME = srcParts.name
            variables.SRC_DIR = srcParts.dir
            let targetPath = substitute(options.variables.DST_PATH,options.alt, variables)
            targetPath = path.resolve(targetPath.replace(options.variables.DST_FILE_EXT, '') + e)
            const parts = path.parse(targetPath)
            if (!exists(parts.dir)) {
                try {
                    dir(parts.dir)
                } catch (e) {
                    if (options.debug) {
                        logger.error(`Error creating target path ${parts.dir} for ${targetPath}`)
                    }
                    return
                }
            }
            targets.push(targetPath)
        });
    }
    return targets
}

export async function convert(options: SlicerOptions) {

    let reports = []

    const onNode = options.onNode || ((data) => reports.push(data))

    options.verbose && logger.info(`Convert ${options.srcInfo.FILES.length} files `)
    await pMap(options.srcInfo.FILES,(f) => {
        const outputs = targets(f, options)
        options.verbose && logger.info(`Convert ${f} to `, outputs)
        return convertFiles(f, outputs, onNode, options)
    }, { concurrency: 1 })

    if (options.report) {
        const reportOutFile: string = substitute(options.report,false,{
            dst: options.srcInfo.DIR
        })
        options.verbose && logger.info(`Write report to ${reportOutFile}`);
        report(reports, reportOutFile)
    }
}
