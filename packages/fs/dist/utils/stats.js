import { join as joinPaths } from 'node:path';
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
export const getFolderSize = async (itemPath, options) => await core(itemPath, options, { errors: true });
/**
 * Returns the size of the folder. If any errors are encountered while traversing the folder, they are silently ignored.
 *
 * The returned folder size might be smaller than the real folder size. It is impossible to know for sure, since errors are ignored.
 *
 * @param {string}  itemPath         - Path of the folder.
 * @param {object}  [options]        - Options.
 * @param {boolean} [options.bigint] - Should the folder size be returned as a BigInt instead of a Number.
 * @param {object}  [options.ignore] - If a file's path matches this regex object, its size is not counted.
 * @param {object}  [options.fs]     - The filesystem that should be used. Uses node fs by default.
 *
 * @returns {Promise<number | bigint>} - The size of the folder in bytes.
 */
getFolderSize.loose = async (itemPath, options) => await core(itemPath, options);
/**
 * Returns the size of the folder. If any errors are encountered while traversing the folder, this method will throw an error.
 *
 * Because errors will otherwise make this method fail, the returned folder size will always be accurate.
 *
 * @param {string}  itemPath         - Path of the folder.
 * @param {object}  [options]        - Options.
 * @param {boolean} [options.bigint] - Should the folder size be returned as a BigInt instead of a Number.
 * @param {object}  [options.ignore] - If a file's path matches this regex object, its size is not counted.
 * @param {object}  [options.fs]     - The filesystem that should be used. Uses node fs by default.
 *
 * @returns {Promise<number | bigint>} - The size of the folder in bytes.
 */
getFolderSize.strict = async (itemPath, options) => await core(itemPath, options, { strict: true });
async function core(rootItemPath, options = {}, returnType = {}) {
    const fs = options.fs || await import('fs/promises');
    const fileSizes = new Map();
    const errors = [];
    await processItem(rootItemPath);
    async function processItem(itemPath) {
        if (options.ignore?.test(itemPath))
            return;
        const stats = returnType.strict ? await fs.lstat(itemPath, { bigint: true }) : await fs.lstat(itemPath, { bigint: true }).catch(error => errors.push(error));
        if (typeof stats !== 'object')
            return;
        fileSizes.set(stats.ino, stats.size);
        if (stats.isDirectory()) {
            const directoryItems = returnType.strict ? await fs.readdir(itemPath) : await fs.readdir(itemPath).catch(error => errors.push(error));
            if (typeof directoryItems !== 'object')
                return;
            await Promise.all(directoryItems.map(directoryItem => processItem(joinPaths(itemPath, directoryItem))));
        }
    }
    let folderSize = Array.from(fileSizes.values()).reduce((total, fileSize) => total + fileSize, 0n);
    if (!options.bigint) {
        if (folderSize > BigInt(Number.MAX_SAFE_INTEGER)) {
            const error = new RangeError('The folder size is too large to return as a Number. You can instruct this package to return a BigInt instead.');
            if (returnType.strict) {
                throw error;
            }
            else {
                errors.push(error);
            }
        }
        folderSize = Number(folderSize);
    }
    if (returnType.errors) {
        return {
            size: folderSize,
            errors: errors.length > 0 ? errors : null,
        };
    }
    else {
        return folderSize;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvc3RhdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksSUFBSSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFDN0M7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLEtBQUssRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUE7QUFFdkc7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsYUFBYSxDQUFDLEtBQUssR0FBRyxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBRWpGOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILGFBQWEsQ0FBQyxNQUFNLEdBQUcsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUlsRyxLQUFLLFVBQVUsSUFBSSxDQUFFLFlBQVksRUFBRSxVQUFjLEVBQUUsRUFBRSxhQUFpQixFQUFFO0lBQ3RFLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxFQUFFLElBQUksTUFBTSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFckQsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUM1QixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFFbEIsTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7SUFFaEMsS0FBSyxVQUFVLFdBQVcsQ0FBQyxRQUFRO1FBQ2pDLElBQUcsT0FBTyxDQUFDLE1B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