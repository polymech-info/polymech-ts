const inherits = require('inherits');

// See https://gist.github.com/RickCarlino/41b8ddd36e41e381c132bbfcd1c31f3a

/** A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0". */
export type JsonRpcVersion = '2.0';

/** Method names that begin with the word rpc followed by a period character
 * (U+002E or ASCII 46) are reserved for rpc-internal methods and extensions
 * and MUST NOT be used for anything else.
 */
export type JsonRpcReservedMethod = string;

/** An identifier established by the Client that MUST contain a String, Number,
 *  or NULL value if included. If it is not included it is assumed to be a
 *  notification. The value SHOULD normally not be Null and Numbers SHOULD
 *  NOT contain fractional parts [2]
 */
export type JsonRpcId = number | string | void;

// tslint:disable-next-line:class-name
interface IJSON_RPC_ERROR<T> {
	/** Must be an integer */
	code: number;
	message: string;
	data?: T;
}

// PRE-DEFINED ERROR CODES
/** An error occurred on the server while parsing the JSON text. */
export const C_PARSE_ERROR = -32700;
/** The JSON sent is not a valid Request object. */
export const C_INVALID_REQUEST = -32600;
/** The method does not exist / is not available. */
export const C_METHOD_NOT_FOUND = -32601;
/** Invalid method parameter(s). */
export const C_INVALID_PARAMS = -32602;
/** Internal JSON-RPC error. */
export const C_INTERNAL_ERROR = -32603;

// tslint:disable-next-line:class-name
export class JSON_RPC_ERROR implements IJSON_RPC_ERROR<any> {
	code: number;
	message: string;
	data?: any;
	constructor(message?: string, code?: number, data?: any) {
		this.code = code;
		this.message = message;
		this.data = data;
	}
}

inherits(JSON_RPC_ERROR, Error); // @TODO, can we extend from native Error ?

export class ParserError extends JSON_RPC_ERROR {
	constructor(message: string) {
		super('Parse error: ' + message, C_PARSE_ERROR);
	}
}
export class InvalidRequest extends JSON_RPC_ERROR {
	constructor() {
		super('Invalid Request ', C_INVALID_REQUEST);
	}
}
export class MethodNotFound extends JSON_RPC_ERROR {
	constructor(message: string) {
		super('Method not found : ' + message, C_METHOD_NOT_FOUND);
	}
}
export class InvalidParams extends JSON_RPC_ERROR {
	constructor(message: string) {
		super('Invalid params ' + message, C_INVALID_PARAMS);
	}
}
export class InternalError extends JSON_RPC_ERROR {
	constructor(message: string, err: IJSON_RPC_ERROR<any>) {
		if (err && err.message) {
			message = err.message;
		} else {
			message = 'Internal error';
		}
		super('Internal error ' + message, C_INTERNAL_ERROR);
	}
}
export class ServerError extends JSON_RPC_ERROR {
	constructor(code: number) {
		if (code < -32099 || code > -32000) {
			throw new Error('Invalid error code');
		}
		super('Server error', code);
	}
}
