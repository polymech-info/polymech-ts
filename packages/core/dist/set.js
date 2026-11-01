/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export class ArraySet {
    _elements;
    constructor(elements = []) {
        this._elements = elements.slice();
    }
    get size() {
        return this._elements.length;
    }
    set(element) {
        this.unset(element);
        this._elements.push(element);
    }
    contains(element) {
        return this._elements.includes(element);
    }
    unset(element) {
        const index = this._elements.indexOf(element);
        if (index > -1) {
            this._elements.splice(index, 1);
        }
    }
    get elements() {
        return this._elements.slice();
    }
}
//# sourceMappingURL=set.js.map