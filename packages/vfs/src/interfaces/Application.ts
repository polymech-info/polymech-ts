import * as koa from "koa";
export { koa as Application };
import * as rpcApp from "../rpc/JSON-RPC-2";
export { rpcApp as RpcApp };

export enum EPersistence {
	MEMORY = <any> 'memory',
	MONGO = <any> 'mongo'
}
