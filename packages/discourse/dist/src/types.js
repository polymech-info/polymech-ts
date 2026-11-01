///////////////////////////////////////////////////////
//
// Sync Types
//
/**
 * An enumeration to narrow a conflict resolve to a single item or for all following conflicts.
 *
 * @export
 * @enum {number}
 */
export var EResolve;
(function (EResolve) {
    /**
     * Always will use the chose conflict settings for all following conflicts.
     */
    EResolve[EResolve["ALWAYS"] = 0] = "ALWAYS";
    /**
     * 'This' will use the conflict settings for a single conflict so the conflict callback will be triggered again for the next conflict.
     */
    EResolve[EResolve["THIS"] = 1] = "THIS";
})(EResolve = EResolve || (EResolve = {}));
/**
 * The possible modes to resolve a conflict during a sync
 *
 * @export
 * @enum {number}
 */
export var EResolveMode;
(function (EResolveMode) {
    EResolveMode[EResolveMode["SKIP"] = 0] = "SKIP";
    EResolveMode[EResolveMode["OVERWRITE"] = 1] = "OVERWRITE";
    EResolveMode[EResolveMode["IF_NEWER"] = 2] = "IF_NEWER";
    EResolveMode[EResolveMode["IF_SIZE_DIFFERS"] = 3] = "IF_SIZE_DIFFERS";
    EResolveMode[EResolveMode["THROW"] = 4] = "THROW";
    EResolveMode[EResolveMode["RETRY"] = 5] = "RETRY";
    EResolveMode[EResolveMode["ABORT"] = 6] = "ABORT";
})(EResolveMode = EResolveMode || (EResolveMode = {}));
//# sourceMappingURL=types.js.map