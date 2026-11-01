export * from './lib/index.js'
export interface IOptions { }
export const clone = (obj) => {

    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

export const parse = (options: IOptions, argv: any): IOptions => {

    return options;
}