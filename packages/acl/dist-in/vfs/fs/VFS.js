/**
 * Node types
 *
 * @export
 * @enum {string}
 */
export var ENodeType;
(function (ENodeType) {
    ENodeType[ENodeType["FILE"] = 'file'] = "FILE";
    ENodeType[ENodeType["DIR"] = 'dir'] = "DIR";
    ENodeType[ENodeType["SYMLINK"] = 'symlink'] = "SYMLINK";
    ENodeType[ENodeType["OTHER"] = 'other'] = "OTHER";
    ENodeType[ENodeType["BLOCK"] = 'block'] = "BLOCK";
})(ENodeType || (ENodeType = {}));
/**
 * General features of a VFS
 *
 * @export
 * @enum {number}
 */
export var ECapabilties;
(function (ECapabilties) {
    ECapabilties[ECapabilties["VERSIONED"] = 0] = "VERSIONED";
    ECapabilties[ECapabilties["CHANGE_MESSAGE"] = 1] = "CHANGE_MESSAGE";
    ECapabilties[ECapabilties["META"] = 2] = "META";
    ECapabilties[ECapabilties["MIME"] = 3] = "MIME";
    ECapabilties[ECapabilties["AUTHORS"] = 4] = "AUTHORS";
    ECapabilties[ECapabilties["META_TREE"] = 5] = "META_TREE";
    ECapabilties[ECapabilties["ROOT"] = 6] = "ROOT";
    ECapabilties[ECapabilties["REMOTE_CONNECTION"] = 7] = "REMOTE_CONNECTION"; // VFS has a remote connection
})(ECapabilties || (ECapabilties = {}));
/**
 * Supported file operations
 *
 * @export
 * @enum {number}
 */
export var EOperations;
(function (EOperations) {
    EOperations[EOperations["LS"] = 0] = "LS";
    EOperations[EOperations["RENAME"] = 1] = "RENAME";
    EOperations[EOperations["COPY"] = 2] = "COPY";
    EOperations[EOperations["DELETE"] = 3] = "DELETE";
    EOperations[EOperations["MOVE"] = 4] = "MOVE";
    EOperations[EOperations["GET"] = 5] = "GET";
    EOperations[EOperations["SET"] = 6] = "SET";
})(EOperations || (EOperations = {}));
/**
 *
 * These flags are used to build the result, adaptive.
 * @TODO: sync with dgrid#configureColumn
 * @export
 * @enum {number}
 */
export var NODE_FIELDS;
(function (NODE_FIELDS) {
    NODE_FIELDS[NODE_FIELDS["SHOW_ISDIR"] = 1602] = "SHOW_ISDIR";
    NODE_FIELDS[NODE_FIELDS["SHOW_OWNER"] = 1604] = "SHOW_OWNER";
    NODE_FIELDS[NODE_FIELDS["SHOW_MIME"] = 1608] = "SHOW_MIME";
    NODE_FIELDS[NODE_FIELDS["SHOW_SIZE"] = 1616] = "SHOW_SIZE";
    NODE_FIELDS[NODE_FIELDS["SHOW_PERMISSIONS"] = 1632] = "SHOW_PERMISSIONS";
    NODE_FIELDS[NODE_FIELDS["SHOW_TIME"] = 1633] = "SHOW_TIME";
    // @TODO: re-impl. du -ahs/x for windows
    NODE_FIELDS[NODE_FIELDS["SHOW_FOLDER_SIZE"] = 1634] = "SHOW_FOLDER_SIZE";
    NODE_FIELDS[NODE_FIELDS["SHOW_FOLDER_HIDDEN"] = 1635] = "SHOW_FOLDER_HIDDEN";
    NODE_FIELDS[NODE_FIELDS["SHOW_TYPE"] = 1636] = "SHOW_TYPE";
    NODE_FIELDS[NODE_FIELDS["SHOW_MEDIA_INFO"] = 1637] = "SHOW_MEDIA_INFO";
})(NODE_FIELDS || (NODE_FIELDS = {}));
export class BindManager {
    constructor(binds) {
        this.binds = binds;
    }
    getAll() {
        return this.binds;
    }
    findByHostMount(mountName) {
        return this.binds.filter(b => b.target.mount === mountName);
    }
}
export class MountManager {
    constructor(mounts) {
        this.mounts = mounts;
    }
    findByName(name) {
        return this.mounts.find(m => m.name === name);
    }
    resolve(vfsPath) {
        var _a;
        const parts = vfsPath.split(':');
        const mountName = (_a = parts[0]) !== null && _a !== void 0 ? _a : '';
        const path = parts.slice(1).join(':');
        const mount = this.findByName(mountName);
        if (!mount) {
            throw new Error(`Mount not found: ${mountName}`);
        }
        return { mount, path };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVkZTLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Zmcy9mcy9WRlMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQU4sSUFBWSxTQU1YO0FBTkQsV0FBWSxTQUFTO0lBQ3BCLDhCQUFPLE1BQWEsVUFBQSxDQUFBO0lBQ3BCLDZCQUFNLEtBQVksU0FBQSxDQUFBO0lBQ2xCLGlDQUFVLFNBQWdCLGFBQUEsQ0FBQTtJQUMxQiwrQkFBUSxPQUFjLFdBQUEsQ0FBQTtJQUN0QiwrQkFBUSxPQUFjLFdBQUEsQ0FBQTtBQUN2QixDQUFDLEVBTlcsU0FBUyxLQUFULFNBQVMsUUFNcEI7QUFDRDs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBTixJQUFZLFlBU1g7QUFURCxXQUFZLFlBQVk7SUFDdkIseURBQWEsQ0FBQTtJQUNiLG1FQUFrQixDQUFBO0lBQ2xCLCtDQUFRLENBQUE7SUFDUiwrQ0FBUSxDQUFBO0lBQ1IscURBQVcsQ0FBQTtJQUNYLHlEQUFhLENBQUE7SUFDYiwrQ0FBUSxDQUFBO0lBQ1IseUVBQXFCLENBQUEsQ0FBQyw4QkFBOEI7QUFDckQsQ0FBQyxFQVRXLFlBQVksS0FBWixZQUFZLFFBU3ZCO0FBQ0Q7Ozs7O0dBS0c7QUFDSCxNQUFNLENBQU4sSUFBWSxXQVFYO0FBUkQsV0FBWSxXQUFXO0lBQ3RCLHlDQUFNLENBQUE7SUFDTixpREFBVSxDQUFBO0lBQ1YsNkNBQVEsQ0FBQTtJQUNSLGlEQUFVLENBQUE7SUFDViw2Q0FBUSxDQUFBO0lBQ1IsMkNBQU8sQ0FBQTtJQUNQLDJDQUFPLENBQUE7QUFDUixDQUFDLEVBUlcsV0FBVyxLQUFYLFdBQVcsUUFRdEI7QUFvREQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFOLElBQVksV0FZWDtBQVpELFdBQVksV0FBVztJQUN0Qiw0REFBaUIsQ0FBQTtJQUNqQiw0REFBaUIsQ0FBQTtJQUNqQiwwREFBZ0IsQ0FBQTtJQUNoQiwwREFBZ0IsQ0FBQTtJQUNoQix3RUFBdUIsQ0FBQTtJQUN2QiwwREFBZ0IsQ0FBQTtJQUNoQix3Q0FBd0M7SUFDeEMsd0VBQXVCLENBQUE7SUFDdkIsNEVBQXlCLENBQUE7SUFDekIsMERBQWdCLENBQUE7SUFDaEIsc0VBQXNCLENBQUE7QUFDdkIsQ0FBQyxFQVpXLFdBQVcsS0FBWCxXQUFXLFFBWXRCO0FBZ0JELE1BQU0sT0FBTyxXQUFXO0lBR3ZCLFlBQVksS0FBZ0I7UUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVELE1BQU07UUFDTCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVELGVBQWUsQ0FBQyxTQUFpQjtRQUNoQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUM7SUFDN0QsQ0FBQztDQUNEO0FBRUQsTUFBTSxPQUFPLFlBQVk7SUFHeEIsWUFBWSxNQUFnQjtRQUMzQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN0QixDQUFDO0lBRUQsVUFBVSxDQUFDLElBQVk7UUFDdEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELE9BQU8sQ0FBQyxPQUFlOztRQUN0QixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sU0FBUyxHQUFHLE1BQUEsS0FBSyxDQUFDLENBQUMsQ0FBQyxtQ0FBSSxFQUFFLENBQUM7UUFDakMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFDRCxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO0lBQ3hCLENBQUM7Q0FDRCJ9