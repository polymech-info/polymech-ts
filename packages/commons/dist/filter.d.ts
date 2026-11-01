import { JSONSchemaForNPMPackageJsonFiles } from '@schemastore/package';
export declare const isAPIPackage: (_path: string) => JSONSchemaForNPMPackageJsonFiles;
export declare const hasDependency: (pkg: string | JSONSchemaForNPMPackageJsonFiles, dep: string) => string;
export declare const isValidMarketplaceComponent: (_path: string) => boolean;
export declare const isInvalidMarketplaceComponent: (_path: string) => boolean;
export declare const isValidLibraryComponent: (_path: string) => boolean;
export declare const PFilterInvalid: {
    marketplace_component: string;
};
export declare const PFilterValid: {
    marketplace_component: string;
    library_component: string;
    package: string;
};
export declare const FiltersValid: {
    marketplace_component: (_path: string) => boolean;
    library_component: (_path: string) => boolean;
    package: (_path: string) => JSONSchemaForNPMPackageJsonFiles;
};
