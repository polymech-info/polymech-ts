export declare const file: {
    write_atomic: any;
};
export declare const json: {
    parse: (text: string, reviver?: (this: any, key: string, value: any) => any) => any;
    serialize: {
        (value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;
        (value: any, replacer?: (number | string)[] | null, space?: string | number): string;
    };
};
