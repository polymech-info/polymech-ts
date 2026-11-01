import { z } from "zod";
export declare const find_items: (nodes: string[], options: any) => {
    rel: any;
    path: any;
    config: any;
}[];
export declare const get: (src: any, root: any, type: any) => IComponentNode[];
export declare const UrlSchema: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
export declare const ExifSchema: z.ZodObject<{
    file: z.ZodAny;
    jfif: z.ZodAny;
    exif: z.ZodAny;
    gps: z.ZodAny;
}, z.core.$strip>;
export declare const ImageMetaSchema: z.ZodObject<{
    format: z.ZodString;
    width: z.ZodNumber;
    height: z.ZodNumber;
    space: z.ZodString;
    channels: z.ZodNumber;
    depth: z.ZodString;
    density: z.ZodNumber;
    chromaSubsampling: z.ZodString;
    isProgressive: z.ZodBoolean;
    resolutionUnit: z.ZodString;
    hasProfile: z.ZodBoolean;
    hasAlpha: z.ZodBoolean;
    orientation: z.ZodNumber;
    exif: z.ZodAny;
}, z.core.$strip>;
export declare const CADMetaSchema: z.ZodObject<{
    file: z.ZodString;
    name: z.ZodString;
    configuration: z.ZodString;
    step: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    html: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ShippingSchema: z.ZodObject<{
    price: z.ZodOptional<z.ZodNumber>;
    transit: z.ZodOptional<z.ZodNumber>;
    handling: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const ManufacturingSchema: z.ZodObject<{
    lead_time: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const ResourceSchema: z.ZodObject<{
    name: z.ZodString;
    url: z.ZodString;
    type: z.ZodString;
}, z.core.$strip>;
export declare const AssetImageSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    url: z.ZodString;
    thumb: z.ZodOptional<z.ZodString>;
    responsive: z.ZodOptional<z.ZodString>;
    meta: z.ZodOptional<z.ZodAny>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
    alt: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    order: z.ZodOptional<z.ZodNumber>;
    exif: z.ZodOptional<z.ZodObject<{
        file: z.ZodAny;
        jfif: z.ZodAny;
        exif: z.ZodAny;
        gps: z.ZodAny;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const GalleryConfig: z.ZodObject<{
    glob: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const GalleryConfigsSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    glob: z.ZodArray<z.ZodString>;
}, z.core.$strip>>;
export declare const AuthorSchema: z.ZodObject<{
    name: z.ZodString;
    url: z.ZodString;
}, z.core.$strip>;
export declare const ContentSchema: z.ZodObject<{
    body: z.ZodOptional<z.ZodString>;
    features: z.ZodOptional<z.ZodString>;
    highlights: z.ZodOptional<z.ZodString>;
    specs: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    resources: z.ZodOptional<z.ZodString>;
    readme: z.ZodOptional<z.ZodString>;
    shared: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const VersionSchema: z.ZodObject<{
    version: z.ZodOptional<z.ZodString>;
    up: z.ZodOptional<z.ZodString>;
    down: z.ZodOptional<z.ZodString>;
    family: z.ZodOptional<z.ZodString>;
    sheet: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AssetsSchema: z.ZodObject<{
    gallery: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodString;
        thumb: z.ZodOptional<z.ZodString>;
        responsive: z.ZodOptional<z.ZodString>;
        meta: z.ZodOptional<z.ZodAny>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
        description: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        height: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        order: z.ZodOptional<z.ZodNumber>;
        exif: z.ZodOptional<z.ZodObject<{
            file: z.ZodAny;
            jfif: z.ZodAny;
            exif: z.ZodAny;
            gps: z.ZodAny;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    renderings: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodString;
        thumb: z.ZodOptional<z.ZodString>;
        responsive: z.ZodOptional<z.ZodString>;
        meta: z.ZodOptional<z.ZodAny>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
        description: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        height: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        order: z.ZodOptional<z.ZodNumber>;
        exif: z.ZodOptional<z.ZodObject<{
            file: z.ZodAny;
            jfif: z.ZodAny;
            exif: z.ZodAny;
            gps: z.ZodAny;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    components: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodString;
        thumb: z.ZodOptional<z.ZodString>;
        responsive: z.ZodOptional<z.ZodString>;
        meta: z.ZodOptional<z.ZodAny>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
        description: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        height: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        order: z.ZodOptional<z.ZodNumber>;
        exif: z.ZodOptional<z.ZodObject<{
            file: z.ZodAny;
            jfif: z.ZodAny;
            exif: z.ZodAny;
            gps: z.ZodAny;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    configurations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodString;
        thumb: z.ZodOptional<z.ZodString>;
        responsive: z.ZodOptional<z.ZodString>;
        meta: z.ZodOptional<z.ZodAny>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
        description: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        height: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        order: z.ZodOptional<z.ZodNumber>;
        exif: z.ZodOptional<z.ZodObject<{
            file: z.ZodAny;
            jfif: z.ZodAny;
            exif: z.ZodAny;
            gps: z.ZodAny;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    showcase: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodString;
        thumb: z.ZodOptional<z.ZodString>;
        responsive: z.ZodOptional<z.ZodString>;
        meta: z.ZodOptional<z.ZodAny>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
        description: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        height: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        order: z.ZodOptional<z.ZodNumber>;
        exif: z.ZodOptional<z.ZodObject<{
            file: z.ZodAny;
            jfif: z.ZodAny;
            exif: z.ZodAny;
            gps: z.ZodAny;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    samples: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodString;
        thumb: z.ZodOptional<z.ZodString>;
        responsive: z.ZodOptional<z.ZodString>;
        meta: z.ZodOptional<z.ZodAny>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
        description: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        height: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        order: z.ZodOptional<z.ZodNumber>;
        exif: z.ZodOptional<z.ZodObject<{
            file: z.ZodAny;
            jfif: z.ZodAny;
            exif: z.ZodAny;
            gps: z.ZodAny;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const ProductionSchema: z.ZodObject<{
    "fusion-folder": z.ZodString;
    "nc-folder": z.ZodString;
    cam: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        url: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ComponentConfigSchema: any;
export type IComponentConfig = z.infer<typeof ComponentConfigSchema>;
export type ICADNodeSchema = z.infer<typeof CADMetaSchema>;
export interface IComponentNode {
    rel: string;
    path: string;
    config: IComponentConfig;
}
