import { PATH_INFO } from "@polymech/commons"

export interface IOptionsCache {
    cache?: boolean
    clear?: boolean
}
export interface IOptionsBase extends IOptionsCache {
    src: string
    srcInfo?: PATH_INFO
    dstInfo?: PATH_INFO
    dst?: string
    alt?: boolean
    debug?: boolean
    verbose?: boolean
    dry?: boolean
    report?: string
    variables: Record<string, string>
    script?: string
    args?: string
    onNode: (data:INodeCallback) => Promise<void>
}
export interface INodeCallback {
    src: string
    target: string
    options: IOptionsBase
}
//////////////////////////////////////////////////////////////
//
//  Solidworks
export interface IBomOptions {    
    'bom-template'?: string
    'bom-detail'?: number
    'bom-type'?: number
    'bom-images'?: boolean
    'bom-config'?: string
}
export interface SolidworkOptions extends IOptionsBase, IBomOptions {
    close?: boolean
    configuration?: string
    height?: number
    hidden?: string
    light?: boolean
    logLevel?: string
    pack?: boolean
    quality?: number
    rebuild?: boolean
    renderer?: string
    save?: boolean
    sw?: string
    swv?: number
    view?: string
    width?: number
    write?: boolean
}

//////////////////////////////////////////////////////////////
//
//  Slic3r

export interface IPrintCenter {
    x: number
    y: number
}

export type EGCodeFlavor = 'reprap' | 'marlin' | 'teacup' | 'makerware' | 'sailfish' | 'mach3' | 'noextrusion'

export interface IBedSize {
    width: number
    height: number
}

export interface IExtruderOffset {
    x: number
    y: number
}

export type TOutputResult = boolean

export interface ISlic3rCLIOptions {
    avoidCrossingPerimeters?: boolean
    bedSize?: IBedSize
    bedTemperature?: number
    bottomSolidLayers?: number
    bridgeAcceleration?: number
    bridgeFanSpeed?: number
    bridgeFlowRatio?: number
    bridgeSpeed?: number
    brimWidth?: number
    completeObjects?: boolean
    cooling?: boolean
    cut?: number
    defaultAcceleration?: number
    disableFanFirstLayers?: number
    dontSupportBridges?: boolean
    duplicate?: number
    duplicateDistance?: number
    duplicateGrid?: string
    endGCode?: boolean
    endGcode?: boolean
    exportSvg?: boolean
    externalPerimeterExtrusionWidth?: number | string
    externalPerimetersFirst?: boolean
    externalPerimeterSpeed?: number
    extraPerimeters?: boolean
    extruderClearanceHeight?: number
    extruderClearanceRadius?: number
    extruderOffset?: IExtruderOffset
    extrusionMultiplier?: number
    extrusionWidth?: number | string
    fanAlwaysOn?: boolean
    fanBelowLayerTime?: number
    filamentDiameter?: number
    fillAngle?: number
    fillDensity?: number
    fillPattern?: string
    firstLayerAcceleration?: number
    firstLayerBedTemperature?: number
    firstLayerExtrusionWidth?: number | string
    firstLayerHeight?: number
    firstLayerSpeed?: number
    firstLayerTemperature?: number
    g0?: boolean
    gapFillSpeed?: number
    GCodeArcs?: boolean
    GCodeComments?: boolean
    GCodeFlavor?: EGCodeFlavor
    infillAcceleration?: number
    infillEveryLayers?: number
    infillExtruder?: number
    infillExtrusionWidth?: number | string
    infillFirst?: boolean
    infillOnlyWhereNeeded?: boolean
    infillSpeed?: number
    info?: boolean
    inputFile?: string
    layerGCode?: boolean
    layerGcode?: boolean
    layerHeight?: number
    load?: string
    log?: string
    maxFanSpeed?: number
    merge?: boolean
    minFanSpeed?: number
    minPrintSpeed?: number
    minSkirtLength?: number
    notes?: string
    nozzleDiameter?: number
    onlyRetractWhenCrossingPerimeters?: boolean
    oozePrevention?: boolean
    outputDirectory?: string
    outputFile?: string
    outputFilenameFormat?: string
    overhangs?: boolean
    perimeterAcceleration?: number
    perimeterExtruder?: number
    perimeterExtrusionWidth?: number | string
    perimeters?: number
    perimeterSpeed?: number
    postProcess?: string[]
    postProcessScripts?: string[]
    pressureAdvance?: number
    printCenter?: IPrintCenter
    profile?: string
    raftLayers?: number
    repair?: boolean
    resolution?: number
    retractBeforeTravel?: number
    retractLayerChange?: boolean
    retractLength?: number
    retractLengthToolchange?: number
    retractLift?: number
    retractRestartExtra?: number
    retractRestartExtraToolchange?: number
    retractSpeed?: number
    rotate?: number
    save?: string
    saveArgs?: string
    saveAsProfile?: string
    scale?: number
    seamPosition?: 'random' | 'nearest' | 'aligned'
    skirtDistance?: number
    skirtHeight?: number
    skirts?: number
    slowdownBelowLayerTime?: number
    smallPerimeterSpeed?: number
    solidFillPattern?: string
    solidInfillBelowArea?: number
    solidInfillEveryLayers?: number
    solidInfillExtruder?: number
    solidInfillExtrusionWidth?: number | string
    solidInfillSpeed?: number
    solidLayers?: boolean
    spiralVase?: boolean
    split?: boolean
    standbyTemperatureDelta?: number
    startGCode?: boolean
    startGcode?: boolean
    supportMaterial?: boolean
    supportMaterialAngle?: number
    supportMaterialEnforceLayers?: number
    supportMaterialExtruder?: number
    supportMaterialExtrusionWidth?: number | string
    supportMaterialInterfaceExtruder?: number
    supportMaterialInterfaceLayers?: number
    supportMaterialInterfaceSpacing?: number
    supportMaterialInterfaceSpeed?: number
    supportMaterialPattern?: string
    supportMaterialSpacing?: number
    supportMaterialSpeed?: number
    supportMaterialThreshold?: number
    temperature?: number
    thinWalls?: boolean
    threads?: number
    toolchangeGCode?: boolean
    toolchangeGcode?: boolean
    topInfillExtrusionWidth?: number | string
    topSolidInfillSpeed?: number
    topSolidLayers?: number
    travelSpeed?: number
    useFirmwareRetraction?: boolean
    useRelativeEDistances?: boolean
    useVolumetricE?: boolean
    vibrationLimit?: number
    wipe?: boolean
    zOffset?: number
}

export type SlicerOptions = IOptionsBase & ISlic3rCLIOptions