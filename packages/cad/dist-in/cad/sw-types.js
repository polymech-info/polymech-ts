export var swRayTraceRenderImageFormat;
(function (swRayTraceRenderImageFormat) {
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_FlexiblePrecision"] = 0] = "swImageFormat_FlexiblePrecision";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_Targa"] = 1] = "swImageFormat_Targa";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_WindowsBmp"] = 2] = "swImageFormat_WindowsBmp";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_HDR"] = 3] = "swImageFormat_HDR";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_JPEG2000"] = 4] = "swImageFormat_JPEG2000";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_JPEG2000_16bit"] = 5] = "swImageFormat_JPEG2000_16bit";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_JPEG2000_16bit_Lossless"] = 6] = "swImageFormat_JPEG2000_16bit_Lossless";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_JPEG"] = 7] = "swImageFormat_JPEG";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_PNG"] = 8] = "swImageFormat_PNG";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_PNG_16bit"] = 9] = "swImageFormat_PNG_16bit";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_SGI_RGB"] = 10] = "swImageFormat_SGI_RGB";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_TIF"] = 11] = "swImageFormat_TIF";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_TIF_16bit"] = 12] = "swImageFormat_TIF_16bit";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_TIF_16bit_uncompr"] = 13] = "swImageFormat_TIF_16bit_uncompr";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_OpenEXR"] = 14] = "swImageFormat_OpenEXR";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_OpenEXR_32bit"] = 15] = "swImageFormat_OpenEXR_32bit";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_OpenEXR_TILED16bit"] = 16] = "swImageFormat_OpenEXR_TILED16bit";
    swRayTraceRenderImageFormat[swRayTraceRenderImageFormat["swImageFormat_OpenEXR_TILED32bit"] = 17] = "swImageFormat_OpenEXR_TILED32bit";
})(swRayTraceRenderImageFormat || (swRayTraceRenderImageFormat = {}));
export var swRayTraceRenderQuality_e;
(function (swRayTraceRenderQuality_e) {
    swRayTraceRenderQuality_e[swRayTraceRenderQuality_e["swRenderQuality_Good"] = 0] = "swRenderQuality_Good";
    swRayTraceRenderQuality_e[swRayTraceRenderQuality_e["swRenderQuality_Better"] = 1] = "swRenderQuality_Better";
    swRayTraceRenderQuality_e[swRayTraceRenderQuality_e["swRenderQuality_Best"] = 2] = "swRenderQuality_Best";
    swRayTraceRenderQuality_e[swRayTraceRenderQuality_e["swRenderQuality_Maximum"] = 3] = "swRenderQuality_Maximum";
})(swRayTraceRenderQuality_e || (swRayTraceRenderQuality_e = {}));
export var ImageAspectRatio;
(function (ImageAspectRatio) {
    ImageAspectRatio["AspectRatio_1_1"] = "1:1";
    ImageAspectRatio["AspectRatio_4_3"] = "4:3";
    ImageAspectRatio["AspectRatio_16_9"] = "16:9";
    ImageAspectRatio["AspectRatio_21_9"] = "21:9";
    ImageAspectRatio["AspectRatio_2_3"] = "2:3";
    ImageAspectRatio["AspectRatio_3_2"] = "3:2";
    ImageAspectRatio["AspectRatio_5_4"] = "5:4";
    ImageAspectRatio["AspectRatio_3_4"] = "3:4";
    ImageAspectRatio["AspectRatio_9_16"] = "9:16";
    ImageAspectRatio["AspectRatio_10_16"] = "10:16";
    ImageAspectRatio["AspectRatio_16_10"] = "16:10";
    ImageAspectRatio["AspectRatio_16_15"] = "16:15";
    ImageAspectRatio["AspectRatio_18_9"] = "18:9";
    ImageAspectRatio["AspectRatio_32_9"] = "32:9";
    ImageAspectRatio["AspectRatio_48_9"] = "48:9";
})(ImageAspectRatio || (ImageAspectRatio = {}));
export var ImageResolution;
(function (ImageResolution) {
    ImageResolution["Resolution_640x480"] = "640x480";
    ImageResolution["Resolution_800x600"] = "800x600";
    ImageResolution["Resolution_1024x768"] = "1024x768";
    ImageResolution["Resolution_1280x720"] = "1280x720";
    ImageResolution["Resolution_1280x800"] = "1280x800";
    ImageResolution["Resolution_1280x1024"] = "1280x1024";
    ImageResolution["Resolution_1366x768"] = "1366x768";
    ImageResolution["Resolution_1440x900"] = "1440x900";
    ImageResolution["Resolution_1600x900"] = "1600x900";
    ImageResolution["Resolution_1680x1050"] = "1680x1050";
    ImageResolution["Resolution_1920x1080"] = "1920x1080";
    ImageResolution["Resolution_1920x1200"] = "1920x1200";
    ImageResolution["Resolution_2560x1440"] = "2560x1440";
    ImageResolution["Resolution_2560x1600"] = "2560x1600";
    ImageResolution["Resolution_3840x2160"] = "3840x2160";
    ImageResolution["Resolution_4096x2160"] = "4096x2160";
    ImageResolution["Resolution_5120x2880"] = "5120x2880";
    ImageResolution["Resolution_7680x4320"] = "7680x4320";
})(ImageResolution || (ImageResolution = {}));
function createRendererOptions(options) {
    const defaults = {
        imageWidth: 800,
        imageHeight: 600,
        imageFormat: 0,
        previewRenderQuality: 50,
        finalRenderQuality: 100,
        bloomEnabled: true,
        bloomThreshold: 0.5,
        bloomRadius: 10,
        contourEnabled: false,
        shadedContour: false,
        contourLineThickness: 1,
        contourLineColor: 0,
        useSolidWorksViewAspectRatio: false,
        defaultImagePath: '',
        useSceneBackgroundImageAspectRatio: false,
        outputAmbientOcclusion: false,
        directCaustics: false,
        causticQuality: 50,
        gamma: 2.2,
        numberOfReflections: 2,
        numberOfRefractions: 2,
        networkRendering: false,
        clientWorkload: 0,
        sendDataForNetworkJob: false,
        networkSharedDirectory: '',
        causticAmount: 0.5,
        customRenderSettings: false,
        contourCartoonRenderingEnabled: false,
        hasCartoonEdges: false,
        hasCartoonShading: false,
        includeAnnotationsInRendering: false,
        renderType: 0,
        renderAnnotationsToSeparateImage: false,
        alphaOutput: false,
        offloadedRendering: false,
    };
    return { ...defaults, ...options };
}
export var EDocumentState;
(function (EDocumentState) {
    //
    // Summary:
    //     Default state of the document
    EDocumentState[EDocumentState["Default"] = 0] = "Default";
    //
    // Summary:
    //     Checks if document is hidden
    EDocumentState[EDocumentState["Hidden"] = 1] = "Hidden";
    //
    // Summary:
    //     Opens document in read-only mode
    EDocumentState[EDocumentState["ReadOnly"] = 2] = "ReadOnly";
    //
    // Summary:
    //     Opens document in view only mode
    EDocumentState[EDocumentState["ViewOnly"] = 4] = "ViewOnly";
    //
    // Summary:
    //     Opens document without displaying any popup messages
    EDocumentState[EDocumentState["Silent"] = 8] = "Silent";
    //
    // Summary:
    //     Opens document in the rapid mode
    //
    // Remarks:
    //     This mode significantly improves the performance of opening but certain functionality
    //     and API migth not be available
    EDocumentState[EDocumentState["Rapid"] = 16] = "Rapid";
})(EDocumentState || (EDocumentState = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ctdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2FkL3N3LXR5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTRFQSxNQUFNLENBQU4sSUFBWSwyQkFtQlg7QUFuQkQsV0FBWSwyQkFBMkI7SUFDbkMsbUlBQStCLENBQUE7SUFDL0IsMkdBQW1CLENBQUE7SUFDbkIscUhBQXdCLENBQUE7SUFDeEIsdUdBQWlCLENBQUE7SUFDakIsaUhBQXNCLENBQUE7SUFDdEIsNkhBQTRCLENBQUE7SUFDNUIsK0lBQXFDLENBQUE7SUFDckMseUdBQWtCLENBQUE7SUFDbEIsdUdBQWlCLENBQUE7SUFDakIsbUhBQXVCLENBQUE7SUFDdkIsZ0hBQXFCLENBQUE7SUFDckIsd0dBQWlCLENBQUE7SUFDakIsb0hBQXVCLENBQUE7SUFDdkIsb0lBQStCLENBQUE7SUFDL0IsZ0hBQXFCLENBQUE7SUFDckIsNEhBQTJCLENBQUE7SUFDM0Isc0lBQWdDLENBQUE7SUFDaEMsc0lBQWdDLENBQUE7QUFDcEMsQ0FBQyxFQW5CVywyQkFBMkIsS0FBM0IsMkJBQTJCLFFBbUJ0QztBQUVELE1BQU0sQ0FBTixJQUFZLHlCQUtYO0FBTEQsV0FBWSx5QkFBeUI7SUFDakMseUdBQW9CLENBQUE7SUFDcEIsNkdBQXNCLENBQUE7SUFDdEIseUdBQW9CLENBQUE7SUFDcEIsK0dBQXVCLENBQUE7QUFDM0IsQ0FBQyxFQUxXLHlCQUF5QixLQUF6Qix5QkFBeUIsUUFLcEM7QUFFRCxNQUFNLENBQU4sSUFBWSxnQkFnQlg7QUFoQkQsV0FBWSxnQkFBZ0I7SUFDeEIsMkNBQXVCLENBQUE7SUFDdkIsMkNBQXVCLENBQUE7SUFDdkIsNkNBQXlCLENBQUE7SUFDekIsNkNBQXlCLENBQUE7SUFDekIsMkNBQXVCLENBQUE7SUFDdkIsMkNBQXVCLENBQUE7SUFDdkIsMkNBQXVCLENBQUE7SUFDdkIsMkNBQXVCLENBQUE7SUFDdkIsNkNBQXlCLENBQUE7SUFDekIsK0NB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