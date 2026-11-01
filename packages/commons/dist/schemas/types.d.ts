export declare enum FLAG {
    /**
     * Instruct for no additional extra processing
     * @constant
     * @type int
     */
    NONE = 0,
    /**
     * Will instruct the pre/post processor to base-64 decode or encode
     * @constant
     * @type int
     */
    BASE_64 = 1,
    /**
     * Post/Pre process the value with a user function
     * @constant
     * @type int
     */
    USE_FUNCTION = 2,
    /**
     * Replace variables with local scope's variables during the post/pre process
     * @constant
     * @type int
     */
    REPLACE_VARIABLES = 4,
    /**
     * Replace variables with local scope's variables during the post/pre process but evaluate the whole string
     * as Javascript
     * @constant
     * @type int
     */
    REPLACE_VARIABLES_EVALUATED = 8,
    /**
     * Will instruct the pre/post processor to escpape evaluated or replaced variables or expressions
     * @constant
     * @type int
     */
    ESCAPE = 16,
    /**
     * Will instruct the pre/post processor to replace block calls with oridinary vanilla script
     * @constant
     * @type int
     */
    REPLACE_BLOCK_CALLS = 32,
    /**
     * Will instruct the pre/post processor to remove variable delimitters/placeholders from the final string
     * @constant
     * @type int
     */
    REMOVE_DELIMTTERS = 64,
    /**
     * Will instruct the pre/post processor to remove   "[" ,"]" , "(" , ")" , "{", "}" , "*" , "+" , "."
     * @constant
     * @type int
     */
    ESCAPE_SPECIAL_CHARS = 128,
    /**
     * Will instruct the pre/post processor to use regular expressions over string substitution
     * @constant
     * @type int
     */
    USE_REGEX = 256,
    /**
     * Will instruct the pre/post processor to use Filtrex (custom bison parser, needs xexpression) over string substitution
     * @constant
     * @type int
     */
    USE_FILTREX = 512,
    /**
     * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
     * @constant
     * @type int
     */
    CASCADE = 1024,
    /**
     * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
     * @constant
     * @type int
     */
    EXPRESSION = 2048,
    /**
     * Dont parse anything
     * @constant
     * @type int
     */
    DONT_PARSE = 4096,
    /**
     * Convert to hex
     * @constant
     * @type int
     */
    TO_HEX = 8192,
    /**
     * Convert to hex
     * @constant
     * @type int
     */
    REPLACE_HEX = 16384,
    /**
     * Wait for finish
     * @constant
     * @type int
     */
    WAIT = 32768,
    /**
     * Wait for finish
     * @constant
     * @type int
     */
    DONT_ESCAPE = 65536,
    /**
     * Flag to mark the maximum core bit mask, after here its user land
     * @constant
     * @type int
     */
    END = 131072
}
export declare enum EType {
    Number = "Number",
    String = "String",
    Boolean = "Boolean",
    Date = "Date",
    TimeStamp = "TimeStamp",
    Duration = "Duration",
    Url = "Url",
    UrlScheme = "Url-Scheme",
    Asset = "Asset",
    Symbol = "Symbol",
    Value = "Value",
    Values = "Values",
    Attribute = "Attribute",
    Parameter = "Parameter",
    Operation = "Operation",
    ParameterOperation = "ParameterOperation",
    Template = "Template",
    Arguments = "Arguments"
}
export type TVector2D = [number, number];
export type TVector3D = [number, number, number];
export type TBBox = [TVector3D, TVector3D];
export type TQuaternion = [number, number, number, number];
export type TFlags = Record<string, bigint>;
export type TExpression = string | [string | RegExp, {
    [key: string]: any;
}];
export type TOptions = {
    flags?: TFlags | {
        [key: string]: any;
    };
};
export interface IUrlScheme {
    url: string;
    options?: {
        [key: string]: any;
    };
}
export interface IAsset {
    urlScheme: IUrlScheme;
    options?: {
        [key: string]: any;
    };
}
export type TSelector = TExpression | [TExpression, {
    [key: string]: any;
}];
export interface ITypeInfo {
    type: string;
    symbol: bigint;
}
export interface IRef {
    key: string | string;
    struct: {
        [key: string]: any;
    };
}
export interface IAttribute {
    type: ITypeInfo;
    value: bigint;
}
export interface IParameter {
    type: ITypeInfo;
    value: bigint;
}
export interface IParameterOperation {
    param1: bigint;
    param2: bigint;
    operation: bigint;
}
export type TTemplate = string | [ITypeInfo | TSelector, {
    [key: string]: any;
}];
export type TArguments = {
    [key: string]: any;
} | any[];
