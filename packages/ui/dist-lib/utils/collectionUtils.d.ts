/**
 * Filters out pictures that are only in private collections.
 * Pictures that are:
 * - Not in any collection: SHOWN
 * - In at least one public collection: SHOWN
 * - Only in private collections: HIDDEN
 */
export declare function filterPrivateCollectionPictures<T extends {
    id: string;
}>(pictures: T[]): Promise<T[]>;
