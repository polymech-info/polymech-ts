export interface IError {
	code?: number | string;
	message?: string;
}
// tslint:disable-next-line:class-name
export interface IJSON_RPC_RESPONSE {
	jsonrpc: string;
	id: string;
	error: any | null;
	result: any;
}
export class Response implements IJSON_RPC_RESPONSE {

	jsonrpc: string = '2.0';
	id: string = '';
	result: string = '';
	error: any = null;

	constructor(id: string, error?: IError, result?: any) {
		if (error && result) {
			throw new Error('Mutually exclusive error and result exist');
		}

		if (id !== null && typeof id !== 'string' && typeof id !== 'number') {
			throw new TypeError('Invalid id type ' + typeof id);
		}

		if (typeof result !== 'undefined') {
			this.result = result;
		} else if (error) {
			console.error('RPC error', error);
			if (typeof error.code !== 'number') {
				throw new TypeError('Invalid error code type ' + typeof error.code);
			}
			if (typeof error.message !== 'string') {
				throw new TypeError('Invalid error message type ' + typeof error.message + ' is not a string! ');
			}
			this.error = error;
		} else {
			throw new Error('Missing result or error');
		}

		this.jsonrpc = '2.0';
		this.id = id;
	}
}
export function Response_(id: string, error?: IError, result?: any): void {
	// if (!(this instanceof Response)) {
	// 	return new JSON_RPC_RESPONSE(id, error, result);
	// }
	if (error && result) {
		throw new Error('Mutually exclusive error and result exist');
	}

	if (id !== null && typeof id !== 'string' && typeof id !== 'number') {
		throw new TypeError('Invalid id type ' + typeof id);
	}

	if (typeof result !== 'undefined') {
		this.result = result;
	} else if (error) {
		if (typeof error.code !== 'number') {
			throw new TypeError('Invalid error code type ' + typeof error.code);
		}
		if (typeof error.message !== 'string') {
			throw new TypeError('Invalid error message type ' + typeof error.message);
		}
		this.error = error;
	} else {
		throw new Error('Missing result or error');
	}

	this.jsonrpc = '2.0';
	this.id = id;
}
