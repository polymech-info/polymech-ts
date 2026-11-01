export * from './enums';
export interface Hash<T> {
    [id: string]: T;
}
export interface List<T> {
    [index: number]: T;
    length: number;
}
/**
 * Interface of the simple literal object with any string keys.
 */
export interface IObjectLiteral {
    [key: string]: any;
}
/**
 * Represents some Type of the Object.
 */
export declare type ObjectType<T> = {
    new (): T;
} | (Function);
/**
 * Same as Partial<T> but goes deeper and makes Partial<T> all its properties and sub-properties.
 */
export declare type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};
export interface IDelimitter {
    begin: string;
    end: string;
}
export declare type JSONPathExpression = string;
