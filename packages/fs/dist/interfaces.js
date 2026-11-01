/////////////////////////////////////////////////////////
//
//  Enums
//
export var ENodeType;
(function (ENodeType) {
    ENodeType["FILE"] = "file";
    ENodeType["DIR"] = "dir";
    ENodeType["SYMLINK"] = "symlink";
    ENodeType["OTHER"] = "other";
    ENodeType["BLOCK"] = "block";
})(ENodeType || (ENodeType = {}));
/**
 * Native errors.
 * @todo : replace with errno.
 */
export let EError = {
    NONE: 'None',
    EXISTS: 'EEXIST',
    PERMISSION: 'EACCES',
    NOEXISTS: 'ENOENT',
    CROSS_DEVICE: 'EXDEV'
};
/**
 * An extended version of Error to make typescript happy. This has been copied from
 * the official Node typings.
 *
 * @export
 * @class ErrnoException
 * @extends {Error}
 */
export class ErrnoException extends Error {
    errno;
    code;
    path;
    syscall;
    stack;
}
/**
 * Basic flags during a file operation.
 *
 * @export
 * @enum {number}
 */
export var EBaseFlags;
(function (EBaseFlags) {
    /**
     * When copying, don't copy symlinks but resolve them instead.
     */
    EBaseFlags[EBaseFlags["FOLLOW_SYMLINKS"] = 8] = "FOLLOW_SYMLINKS";
})(EBaseFlags || (EBaseFlags = {}));
/**
 * Flags to determine certain properties during inspection.
 *
 * @export
 * @enum {number}
 */
export var EInspectFlags;
(function (EInspectFlags) {
    EInspectFlags[EInspectFlags["MODE"] = 2] = "MODE";
    EInspectFlags[EInspectFlags["TIMES"] = 4] = "TIMES";
    EInspectFlags[EInspectFlags["SYMLINKS"] = 8] = "SYMLINKS";
    EInspectFlags[EInspectFlags["FILE_SIZE"] = 16] = "FILE_SIZE";
    EInspectFlags[EInspectFlags["DIRECTORY_SIZE"] = 32] = "DIRECTORY_SIZE";
    EInspectFlags[EInspectFlags["CHECKSUM"] = 64] = "CHECKSUM";
    EInspectFlags[EInspectFlags["MIME"] = 128] = "MIME";
})(EInspectFlags || (EInspectFlags = {}));
/**
 * Status of a node operation.
 *
 * @export
 * @enum {number}
 */
export var ENodeOperationStatus;
(function (ENodeOperationStatus) {
    // Node has been collected
    ENodeOperationStatus[ENodeOperationStatus["COLLECTED"] = 0] = "COLLECTED";
    // Node has been checked for existence
    ENodeOperationStatus[ENodeOperationStatus["CHECKED"] = 1] = "CHECKED";
    // Node is in progress, before copy
    ENodeOperationStatus[ENodeOperationStatus["PROCESSING"] = 2] = "PROCESSING";
    // Node is in process
    ENodeOperationStatus[ENodeOperationStatus["PROCESS"] = 3] = "PROCESS";
    // Node is in conflict, and user is being asked what to do
    ENodeOperationStatus[ENodeOperationStatus["ASKING"] = 4] = "ASKING";
    // Node conflict has been resolved by user
    ENodeOperationStatus[ENodeOperationStatus["ANSWERED"] = 5] = "ANSWERED";
    // Node has been copied
    ENodeOperationStatus[ENodeOperationStatus["DONE"] = 6] = "DONE";
})(ENodeOperationStatus || (ENodeOperationStatus = {}));
/**
 * The possible modes to resolve a conflict during copy and move.
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
    EResolveMode[EResolveMode["APPEND"] = 4] = "APPEND";
    EResolveMode[EResolveMode["THROW"] = 5] = "THROW";
    EResolveMode[EResolveMode["RETRY"] = 6] = "RETRY";
    EResolveMode[EResolveMode["ABORT"] = 7] = "ABORT";
})(EResolveMode || (EResolveMode = {}));
/**
 * Additional flags for copy
 *
 * @export
 * @enum {number}
 */
export var ECopyFlags;
(function (ECopyFlags) {
    /**
     * Transfer atime and mtime of source to target
     */
    ECopyFlags[ECopyFlags["NONE"] = 0] = "NONE";
    /**
     * Transfer atime and mtime of source to target
     */
    ECopyFlags[ECopyFlags["PRESERVE_TIMES"] = 2] = "PRESERVE_TIMES";
    /**
     * Empty the target folder
     */
    ECopyFlags[ECopyFlags["EMPTY"] = 4] = "EMPTY";
    /**
     * When copying, don't copy symlinks but resolve them instead.
     */
    ECopyFlags[ECopyFlags["FOLLOW_SYMLINKS"] = 8] = "FOLLOW_SYMLINKS";
    /**
     * Collect errors & success
     */
    ECopyFlags[ECopyFlags["REPORT"] = 16] = "REPORT";
})(ECopyFlags || (ECopyFlags = {}));
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
})(EResolve || (EResolve = {}));
/**
 * Additional flags for delete
 *
 * @export
 * @enum {number}
 */
export var EDeleteFlags;
(function (EDeleteFlags) {
    EDeleteFlags[EDeleteFlags["REPORT"] = 16] = "REPORT";
})(EDeleteFlags || (EDeleteFlags = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbnRlcmZhY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHlEQUF5RDtBQUN6RCxFQUFFO0FBQ0YsU0FBUztBQUNULEVBQUU7QUFDRixNQUFNLENBQU4sSUFBWSxTQU1YO0FBTkQsV0FBWSxTQUFTO0lBQ3BCLDBCQUFhLENBQUE7SUFDYix3QkFBVyxDQUFBO0lBQ1gsZ0NBQW1CLENBQUE7SUFDbkIsNEJBQWUsQ0FBQTtJQUNmLDRCQUFlLENBQUE7QUFDaEIsQ0FBQyxFQU5XLFNBQVMsS0FBVCxTQUFTLFFBTXBCO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLElBQUksTUFBTSxHQUFRO0lBQ3hCLElBQUksRUFBRSxNQUFNO0lBQ1osTUFBTSxFQUFFLFFBQVE7SUFDaEIsVUFBVSxFQUFFLFFBQVE7SUFDcEIsUUFBUSxFQUFFLFFBQVE7SUFDbEIsWUFBWSxFQUFFLE9BQU87Q0FDckIsQ0FBQztBQWtERjs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxPQUFPLGNBQWUsU0FBUSxLQUFLO0lBQ2pDLEtBQUssQ0FBUztJQUNkLElBQUksQ0FBUztJQUNiLElBQUksQ0FBUztJQUNiLE9BQU8sQ0FBUztJQUNoQixLQUFLLENBQVM7Q0FDckI7QUFZRDs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBTixJQUFZLFVBS1g7QUFMRCxXQUFZLFVBQVU7SUFDckI7O09BRUc7SUFDSCxpRUFBbUIsQ0FBQTtBQUNwQixDQUFDLEVBTFcsVUFBVSxLQUFWLFVBQVUsUUFLckI7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBTixJQUFZLGFBUVg7QUFSRCxXQUFZLGFBQWE7SUFDeEIsaURBQVEsQ0FBQTtJQUNSLG1EQUFTLENBQUE7SUFDVCx5REFBWSxDQUFBO0lBQ1osNERBQWMsQ0FBQTtJQUNkLHNFQUFtQixDQUFBO0lBQ25CLDBEQUFhLENBQUE7SUFDYixtREFBVSxDQUFBO0FBQ1gsQ0FBQyxFQVJXLGFBQWEsS0FBYixhQUFhLFFBUXhCO0FBdUZEOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFOLElBQVksb0JBZVg7QUFmRCxXQUFZLG9CQUFvQjtJQUMvQiwwQkFBMEI7SUFDMUIseUVBQVMsQ0FBQTtJQUNULHNDQUFzQztJQUN0QyxxRUFBTyxDQUFBO0lBQ1AsbUNBQW1DO0lBQ25DLDJFQUFVLENBQUE7SUFDVixxQkFBcUI7SUFDckIscUVBQU8sQ0FBQTtJQUNQLDBEQUEwRDtJQUMxRCxtRUFBTSxDQUFBO0lBQ04sMENBQTBDO0lBQzFDLHVFQUFRLENBQUE7SUFDUix1QkFBdUI7SUFDdkIsK0RBQUksQ0FBQTtBQUNMLENBQUMsRUFmVyxvQkFBb0IsS0FBcEIsb0JBQW9CLFFBZS9CO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQU4sSUFBWSxZQVNYO0FBVEQsV0FBWSxZQUFZO0lBQ3ZCLCtDQUFRLENBQUE7SUFDUix5REFBUyxDQUFBO0lBQ1QsdURBQVEsQ0FBQTtJQUNSLHFFQUFlLENBQUE7SUFDZixtREFBTSxDQUFBO0lBQ04saURBQUssQ0FBQTtJQUNMLGlEQUFLLENBQUE7SUFDTCxpREFBSyxDQUFBO0FBQ04sQ0FBQyxFQVRXLFlBQVksS0FBWixZQUFZLFFBU3ZCO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQU4sSUFBWSxVQXFCWDtBQXJCRCxXQUFZLFVBQVU7SUFDckI7O09BRUc7SUFDSCwyQ0FBUSxDQUFBO0lBQ1I7O09BRUc7SUFDSCwrREFBa0IsQ0FBQTtJQUNsQjs7T0FFRztJQUNILDZDQUFTLENBQUE7SUFDVDs7T0FFRztJQUNILGlFQUFtQixDQUFBO0lBQ25COztPQUVHO0lBQ0gsZ0RBQVcsQ0FBQTtBQUNaLENBQUMsRUFyQlcsVUFBVSxLQUFWLFVBQVUsUUFxQnJCO0FBcUhEOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFOLElBQVksUUFTWDtBQVRELFdBQVksUUFBUTtJQUNuQjs7T0FFRztJQUNILDJDQUFNLENBQUE7SUFDTjs7T0FFRztJQUNILHVDQUFJLENBQUE7QUFDTCxDQUFDLEVBVFcsUUFBUSxLQUFSLFFBQVEsUUFTbkI7QUF3REQ7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQU4sSUFBWSxZQUVYO0FBRkQsV0FBWSxZQUFZO0lBQ3ZCLG9EQUFXLENBQUE7QUFDWixDQUFDLEVBRlcsWUFBWSxLQUFaLFlBQVksUUFFdkIifQ==