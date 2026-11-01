export * from './lib/index.js'

import { IOptionsMap } from './types.js'

export const clone = (obj) => {

    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

export const parse = (options: IOptionsMap, argv: any): IOptionsMap => {
    return options;
}