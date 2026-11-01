import * as CLI from 'yargs';

import { crawler } from './crawlerBazar';

const _sanitize = require("sanitize-filename");
const filenamify = require('filenamify');

import * as path from 'path';

import { resolve } from '@polymech/osr-cli-commons/fs';
import { sync as exists } from '@polymech/fs/exists';
import { sync as dir } from '@polymech/fs/dir';
import { sync as read } from '@polymech/fs/read';
import { sync as write } from '@polymech/fs/write';
import { sync as rm } from '@polymech/fs/remove';
import pMap from 'p-map';

import {
    bazar_root_path
} from './lib'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('src', {
        default: bazar_root_path('index_bazar.json'),
        describe: 'The source file'
    }).option('dst', {
        default:  bazar_root_path('index_bazar_results.json'),
        describe: 'The dst file'
    }).option('debug', {
        default: 'false',
        describe: 'Enable internal debug message'
    })
};

let options = (yargs: CLI.Argv) => defaultOptions(yargs);

export const register = (cli: CLI.Argv) => {
    return cli.command('index-bazar', 'creates index_bazar_results.json', options, 
    async (argv: CLI.Arguments) => {

        if (argv.help) { return; }

        const src = path.resolve(resolve((argv as any).src));
        const dst = path.resolve(resolve((argv as any).dst));
        
        console.log('read ' + src);
        console.log('write to ' + dst);

        const index = read(src, 'json')
        let products = 0;
        let vendorUrls = [];

        Object.keys(index).forEach((v)=>{
            products+=index[v].products.length
            vendorUrls.push(index[v].url)
        })

        const ret = {
            nbUsers: Object.keys(index).length,
            products: products,
            vendorUrls,
            users: Object.keys(index)
        }

        write(dst, ret)
    });
};
