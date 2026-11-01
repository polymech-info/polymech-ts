import { TagToken, TypeGuards, evalToken, evalQuotedToken, Hash, Context, Tokenizer, Emitter, TopLevelToken } from '../liquidjs/liquid'
import { read } from '../lib/net/sheets';
import * as jsonpath from 'jsonpath'

import { get as cache_get, put as cache_put, } from 'cacache'

import { logger } from '../index'
import { MODULE_NAME } from '../constants'

import { sync as exists } from '@plastichub/fs/exists'
import { sync as mkdir } from '@plastichub/fs/dir'

import { OSR_CACHE } from '@plastichub/osr-commons'

import * as fs_path from 'path'

const cache_path = (_namespace: string) => `${fs_path.resolve(fs_path.join(OSR_CACHE(), _namespace))}`


export async function testDS(engine) {
    // let ret = await read('1oVEiGH4o3SV-mAA3Mb-WNVJMyYl4VMxLjWjrSw_ipJY', 'ElenaMargin');
    // console.log('sheet result : ', ret);
}


export const register = (engine) => {

    engine.registerTag('googlesheet', {

        parse: function (token: TagToken, other) {
            const args = token.args
            const tokenizer = new Tokenizer(args, this.liquid.options.operatorsTrie)
            this.name = tokenizer.readValue();
            const begin = tokenizer.p;
            tokenizer.readIdentifier();
            tokenizer.p = begin;
            this.hash = new Hash(tokenizer.remaining());

        },
        render: function* (ctx: Context, emitter: Emitter) {
            const { liquid, hash, name } = this;

            let name_ = ctx.opts.dynamicPartials
                ? (TypeGuards.isQuotedToken(name)
                    ? yield (evalQuotedToken(name))
                    : yield evalToken(name, ctx))
                : name.getText();

            const id = this.hash.hash['id'];
            let id_ = ctx.opts.dynamicPartials
                ? (TypeGuards.isQuotedToken(id)
                    ? yield (evalQuotedToken(id))
                    : yield evalToken(id, ctx))
                : id.getText();

            const range = this.hash.hash['range'];
            let range_ = ctx.opts.dynamicPartials
                ? (TypeGuards.isQuotedToken(range)
                    ? yield (evalQuotedToken(range))
                    : yield evalToken(range, ctx))
                : range.getText();

            const path = this.hash.hash['path'];
            let path_;

            if (path) {
                path_ = ctx.opts.dynamicPartials
                    ? (TypeGuards.isQuotedToken(path)
                        ? yield (evalQuotedToken(path))
                        : yield evalToken(path, ctx))
                    : path.getText();
            }

            const cache = this.hash.hash['cache']
            let cache_ = true

            if (cache) {
                cache_ = ctx.opts.dynamicPartials
                    ? (TypeGuards.isQuotedToken(path)
                        ? yield (evalQuotedToken(path))
                        : yield evalToken(path, ctx))
                    : cache.getText();
            }

            const assign = this.hash.hash['assign'];
            let assign_;

            if (assign) {
                assign_ = ctx.opts.dynamicPartials
                    ? (TypeGuards.isQuotedToken(assign)
                        ? yield (evalQuotedToken(assign))
                        : yield evalToken(path, ctx))
                    : assign_.getText();
            }

            const cache_dir = fs_path.resolve(`${cache_path(MODULE_NAME)}`);
            if (!exists(cache_dir)) {
                mkdir(cache_dir);
            }

            const c_integrity = `${id_}_${range_}`;
            const cached = yield cache_get.info(cache_dir, c_integrity);

            let data: any = [];

            if (cached && cache_) {
                data = JSON.parse(((yield cache_get(cache_dir, c_integrity)).data as Buffer).toString())
            } else {
                data = yield read(id_, range_);
            }

            let ret: any = [];

            if (path) {
                try {
                    ret = jsonpath.query(data, path_)
                    if (assign_) {
                        ctx.bottom()[assign_] = ret[0]
                        liquid.owner.variables[assign_] = ret[0]
                        ret = ''
                    }
                    ret = ret[0]
                } catch (e) {
                    logger.error('error jsonpath', e)
                }
            }
            ret = data[0];

            if (cache_ && !cached) {
                yield cache_put(cache_dir, c_integrity, JSON.stringify(data, null, 2));
            }
            return ret;
        }
    });
}
