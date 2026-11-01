import * as CLI from 'yargs'
import { PATH_INFO } from '@plastichub/osr-commons'
import { IObjectLiteral, Hash } from '@plastichub/core'

import { FS } from './liquidjs/fs/fs'

export interface DisabledPlugins extends Hash<boolean> { };
export interface List<T> {
	[index: number]: T
	length: number;
}
export type ObjectType<T> = { new(): T } | (Function)
export type DeepPartial<T> = {
	[P in keyof T]?: DeepPartial<T[P]>
}
export interface IDelimitter {
	begin: '%'
	end: '%'
}

export type JSONPathExpression = string

export enum FLAG {
	/**
	 * Instruct for no additional extra processing
	 * @constant
	 * @type int
	 */
	NONE = 0x00000000,
	/**
	 * Will instruct the pre/post processor to base-64 decode or encode
	 * @constant
	 * @type int
	 */
	BASE_64 = 0x00000001,
	/**
	 * Post/Pre process the value with a user function
	 * @constant
	 * @type int
	 */
	USE_FUNCTION = 0x00000002,
	/**
	 * Replace variables with local scope's variables during the post/pre process
	 * @constant
	 * @type int
	 */
	REPLACE_VARIABLES = 0x00000004,
	/**
	 * Replace variables with local scope's variables during the post/pre process but evaluate the whole string
	 * as Javascript
	 * @constant
	 * @type int
	 */
	REPLACE_VARIABLES_EVALUATED = 0x00000008,
	/**
	 * Will instruct the pre/post processor to escpape evaluated or replaced variables or expressions
	 * @constant
	 * @type int
	 */
	ESCAPE = 0x00000010,
	/**
	 * Will instruct the pre/post processor to replace block calls with oridinary vanilla script
	 * @constant
	 * @type int
	 */
	REPLACE_BLOCK_CALLS = 0x00000020,
	/**
	 * Will instruct the pre/post processor to remove variable delimitters/placeholders from the final string
	 * @constant
	 * @type int
	 */
	REMOVE_DELIMTTERS = 0x00000040,
	/**
	 * Will instruct the pre/post processor to remove   "[" ,"]" , "(" , ")" , "{", "}" , "*" , "+" , "."
	 * @constant
	 * @type int
	 */
	ESCAPE_SPECIAL_CHARS = 0x00000080,
	/**
	 * Will instruct the pre/post processor to use regular expressions over string substitution
	 * @constant
	 * @type int
	 */
	USE_REGEX = 0x00000100,
	/**
	 * Will instruct the pre/post processor to use Filtrex (custom bison parser, needs xexpression) over string substitution
	 * @constant
	 * @type int
	 */
	USE_FILTREX = 0x00000200,
	/**
	 * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
	 * @constant
	 * @type int
	 */
	CASCADE = 0x00000400,
	/**
	 * Cascade entry. There are cases where #USE_FUNCTION is not enough or we'd like to avoid further type checking.
	 * @constant
	 * @type int
	 */
	EXPRESSION = 0x00000800,
	/**
	 * Dont parse anything
	 * @constant
	 * @type int
	 */
	DONT_PARSE = 0x000001000,
	/**
	 * Convert to hex
	 * @constant
	 * @type int
	 */
	TO_HEX = 0x000002000,
	/**
	 * Convert to hex
	 * @constant
	 * @type int
	 */
	REPLACE_HEX = 0x000004000,
	/**
	 * Wait for finish
	 * @constant
	 * @type int
	 */
	WAIT = 0x000008000,
	/**
	 * Wait for finish
	 * @constant
	 * @type int
	 */
	DONT_ESCAPE = 0x000010000,
	/**
	 * Flag to mark the maximum core bit mask, after here its user land
	 * @constant
	 * @type int
	 */
	END = 0x000020000
}

export type LanguageType = "osr" | "liquid"
export type OutputType = "html" | "md" | "raw" | "pretty"

export interface OptionEx {
	include?: string | string[]
	exclude?: string | string[]
	query?: string | string[]
}
export interface IBaseOptions {
	format?: OutputType
	language?: LanguageType
	output?: string
	cwd?: string
	env?: string
	root?: string | string[]
	profile?: IProfile
	bootstrap?: string
}

export type IDefaultCLIArgs = CLI.Arguments & IBaseOptions & {
	stdout: boolean
	variables?: any
}

export type IOptions = IBaseOptions & {
	template?: string
	string?: string
	source?: string
	trace?: string
	logLevel?: string
	output?: string
	variables?: Hash<any>
	cache?: boolean
	module?: string
	stdout?: boolean
	dry?: boolean
	srcInfo?: PATH_INFO
	targetInfo?: PATH_INFO
	pathVariables?: Hash<any>
	plugins?: string[]
	alt?: boolean
	language?: string // (osr|liquid)
	targetLanguage?: string
	sourceLanguage?: string
	fs?: FS
	resolve?: (file: string) => string
}

export interface IEnvProfile {
	includes?: string[]
	variables?: Record<string, string>
}

export interface IProfile {
	includes?: string[]
	variables?: Hash<string>
	env?: Record<string, IEnvProfile>
}

export enum EType 
{
    Number = 'Number',
    String = 'String',
    Boolean = 'Boolean',
    Date = 'Date',
    TimeStamp = 'TimeStamp',
    Duration = 'Duration',
    Url = 'Url',
    UrlScheme = 'Url-Scheme',
    Asset = 'Asset',
    Symbol = 'Symbol',
    Value = 'Value',
    Values = 'Values',
    Attribute = 'Attribute',
    Parameter = 'Parameter',
    Operation = 'Operation',
    ParameterOperation = 'ParameterOperation',
    Template = 'Template',
    Arguments = 'Arguments'
}
export type TVector2D = [number, number];
export type TVector3D = [number, number, number];
export type TBBox = [TVector3D, TVector3D];
export type TQuaternion = [number, number, number, number];
export type TFlags = Record<string, bigint>;
export type TExpression = string | [string | RegExp, { [key: string]: any }];
export type TOptions = { flags?: TFlags | { [key: string]: any } };

export interface IUrlScheme {
	url: string;
	options?: { [key: string]: any };
}

export interface IAsset {
	urlScheme: IUrlScheme;
	options?: { [key: string]: any };
}

export type TSelector = TExpression | [TExpression, { [key: string]: any }];

export interface ITypeInfo {
	type: string;
	symbol: bigint;
}

export interface IRef {
	key: string | string;
	struct: { [key: string]: any };
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

export type TTemplate = string | [ITypeInfo | TSelector, { [key: string]: any }];
export type TArguments = { [key: string]: any } | any[];

export * from './zod_types'
export * from './zod_schema'