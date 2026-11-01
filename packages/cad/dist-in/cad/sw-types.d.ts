export interface IComponent {
    Name: string;
    Path: string;
    IsSuppressed: boolean;
}
export interface IMass {
    Mass: number;
    Density: number;
    Volume: number;
    SurfaceArea: number;
    CenterOfMassX: number;
    CenterOfMassY: number;
    CenterOfMassZ: number;
}
export interface IBox {
    MinX: number;
    MinY: number;
    MinZ: number;
    MaxX: number;
    MaxY: number;
    MaxZ: number;
}
export interface IMaterial {
    Material: string;
    "Materials": string;
}
export interface IProperties {
    [key: string]: object;
}
export interface IAssembly {
    Components: IComponent[];
}
export interface ITreeNode {
    Name: string;
    Children: Node[];
    Path: string;
    Parent: string | null;
    Properties: IProperties;
    Equations: {
        [key: string]: number | string;
    };
    Mass: IMass;
    Box: IBox;
    Material: {
        [key: string]: string;
    };
    States: {
        [key: string]: object;
    };
    LaserParts: any;
    activeConfiguration: any;
}
export interface Configuration {
    "Total Bounding Box Length"?: string;
    "Total Bounding Box Width"?: string;
    "Total Bounding Box Thickness"?: string;
    "Total Bounding Box Volume"?: string;
    "Weight"?: string;
    "Cost - Total Cost"?: string;
    "IsLaser?": string;
    "Hide"?: string;
    "Catalog"?: string;
    "Configurations"?: string;
}
export interface IConfigurations {
    [key: string]: Configuration;
}
export interface IAssemblyData {
    assembly: IAssembly;
    root: ITreeNode;
    Configurations: IConfigurations;
}
export declare enum swRayTraceRenderImageFormat {
    swImageFormat_FlexiblePrecision = 0,
    swImageFormat_Targa = 1,
    swImageFormat_WindowsBmp = 2,
    swImageFormat_HDR = 3,
    swImageFormat_JPEG2000 = 4,
    swImageFormat_JPEG2000_16bit = 5,
    swImageFormat_JPEG2000_16bit_Lossless = 6,
    swImageFormat_JPEG = 7,
    swImageFormat_PNG = 8,
    swImageFormat_PNG_16bit = 9,
    swImageFormat_SGI_RGB = 10,
    swImageFormat_TIF = 11,
    swImageFormat_TIF_16bit = 12,
    swImageFormat_TIF_16bit_uncompr = 13,
    swImageFormat_OpenEXR = 14,
    swImageFormat_OpenEXR_32bit = 15,
    swImageFormat_OpenEXR_TILED16bit = 16,
    swImageFormat_OpenEXR_TILED32bit = 17
}
export declare enum swRayTraceRenderQuality_e {
    swRenderQuality_Good = 0,
    swRenderQuality_Better = 1,
    swRenderQuality_Best = 2,
    swRenderQuality_Maximum = 3
}
export declare enum ImageAspectRatio {
    AspectRatio_1_1 = "1:1",
    AspectRatio_4_3 = "4:3",
    AspectRatio_16_9 = "16:9",
    AspectRatio_21_9 = "21:9",
    AspectRatio_2_3 = "2:3",
    AspectRatio_3_2 = "3:2",
    AspectRatio_5_4 = "5:4",
    AspectRatio_3_4 = "3:4",
    AspectRatio_9_16 = "9:16",
    AspectRatio_10_16 = "10:16",
    AspectRatio_16_10 = "16:10",
    AspectRatio_16_15 = "16:15",
    AspectRatio_18_9 = "18:9",
    AspectRatio_32_9 = "32:9",
    AspectRatio_48_9 = "48:9"
}
export declare enum ImageResolution {
    Resolution_640x480 = "640x480",
    Resolution_800x600 = "800x600",
    Resolution_1024x768 = "1024x768",
    Resolution_1280x720 = "1280x720",
    Resolution_1280x800 = "1280x800",
    Resolution_1280x1024 = "1280x1024",
    Resolution_1366x768 = "1366x768",
    Resolution_1440x900 = "1440x900",
    Resolution_1600x900 = "1600x900",
    Resolution_1680x1050 = "1680x1050",
    Resolution_1920x1080 = "1920x1080",
    Resolution_1920x1200 = "1920x1200",
    Resolution_2560x1440 = "2560x1440",
    Resolution_2560x1600 = "2560x1600",
    Resolution_3840x2160 = "3840x2160",
    Resolution_4096x2160 = "4096x2160",
    Resolution_5120x2880 = "5120x2880",
    Resolution_7680x4320 = "7680x4320"
}
export interface IRayTraceRendererOptions {
    imageWidth: number;
    imageHeight: number;
    imageFormat: number;
    previewRenderQuality: number;
    finalRenderQuality: number;
    bloomEnabled: boolean;
    bloomThreshold: number;
    bloomRadius: number;
    contourEnabled: boolean;
    shadedContour: boolean;
    contourLineThickness: number;
    contourLineColor: number;
    useSolidWorksViewAspectRatio: boolean;
    defaultImagePath: string;
    useSceneBackgroundImageAspectRatio: boolean;
    outputAmbientOcclusion: boolean;
    directCaustics: boolean;
    causticQuality: number;
    gamma: number;
    numberOfReflections: number;
    numberOfRefractions: number;
    networkRendering: boolean;
    clientWorkload: number;
    sendDataForNetworkJob: boolean;
    networkSharedDirectory: string;
    causticAmount: number;
    customRenderSettings: boolean;
    contourCartoonRenderingEnabled: boolean;
    hasCartoonEdges: boolean;
    hasCartoonShading: boolean;
    includeAnnotationsInRendering: boolean;
    renderType: number;
    renderAnnotationsToSeparateImage: boolean;
    alphaOutput: boolean;
    offloadedRendering: boolean;
}
export declare enum EDocumentState {
    Default = 0,
    Hidden = 1,
    ReadOnly = 2,
    ViewOnly = 4,
    Silent = 8,
    Rapid = 16
}
