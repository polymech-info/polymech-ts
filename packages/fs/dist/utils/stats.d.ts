/**
 * Returns an object containing the size of the folder and a list of errors encountered while traversing the folder.
 *
 * If any errors are returned, the returned folder size is likely smaller than the real folder size.
 *
 * @param {string}  itemPath         - Path of the folder.
 * @param {object}  [options]        - Options.
 * @param {boolean} [options.bigint] - Should the folder size be returned as a BigInt instead of a Number.
 * @param {object}  [options.ignore] - If a file's path matches this regex object, its size is not counted.
 * @param {object}  [options.fs]     - The filesystem that should be used. Uses node fs by default.
 *
 * @returns {Promise<{size: number | bigint, errors: Array<Error> | null}>} - An object containing the size of the folder in bytes and a list of encountered errors.
 */
export declare const getFolderSize: {
    (itemPath: any, options: any): Promise<any>;
    loose(itemPath: any, options: any): Promise<any>;
    strict(itemPath: any, options: any): Promise<any>;
};
