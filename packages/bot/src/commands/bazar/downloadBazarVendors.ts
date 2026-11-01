import * as CLI from 'yargs';

import { crawler } from './crawlerBazarVendor';

const _sanitize = require("sanitize-filename");
const filenamify = require('filenamify');
import { resolve } from '@polymech/osr-cli-commons/fs';
import { sync as read } from '@polymech/fs/read';
import { sync as write } from '@polymech/fs/write';

import * as path from 'path';
import { sync as exists } from '@polymech/fs/exists';
import { sync as dir } from '@polymech/fs/dir';
import { sync as rm } from '@polymech/fs/remove';

import pMap from 'p-map';
import {
    regexEx,
    remo,
    removeEmojis,
    removeEmojisEx,
    bazar_root_path
} from './lib'

import { logger } from '../../'

/*
const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('src', {
        default: '${OSR_ROOT}/pp-bazar/${YYYY}/${MM}/index_bazar_results.json',
        describe: 'The source index file'
    }).option('index', {
        default: '${OSR_ROOT}/pp-bazar/${YYYY}/${MM}/index_bazar.json',
        describe: 'The source index file'
    }).option('dst', {
        default: '${OSR_ROOT}/pp-bazar/${YYYY}/${MM}/vendors',
        describe: 'Destination for vendor files'
    }).option('debug', {
        default: 'false',
        describe: 'Enable internal debug message'
    })
};
*/
const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('src', {
        default: bazar_root_path('index_bazar_results.json'),
        describe: 'The source index file'
    }).option('index', {
        default: bazar_root_path('index_bazar.json'),
        describe: 'The source index file'
    }).option('dst', {
        default: bazar_root_path('vendors'),
        describe: 'Destination for vendor files'
    }).option('debug', {
        default: 'false',
        describe: 'Enable internal debug message'
    })
};


let options = (yargs: CLI.Argv) => defaultOptions(yargs);


export const register = (cli: CLI.Argv) => {
    return cli.command('bazar-download-vendor', '', options, async (argv: CLI.Arguments) => {

        if (argv.help) { return; }


        const args = argv as any

        process.env['APIFY_LOCAL_STORAGE_DIR'] = '.'
        rm(path.resolve('./request_queues'))

        const src = path.resolve(resolve(args.src))

        let data = read(src) as string;

        /*
        data = removeEmojis(data);
        data = remo(data);
        data = removeEmojisEx(data);
        data = data.replace(/^(\d+(?:,\d+)*)[\s\u200e]+(.*)/, '');
        data = data.replace(/[^\x00-\x7F]/g, "");
        */
        
        // write(src, data)

        const dst = path.resolve(resolve(args.dst))

        const index_bazar = path.resolve(resolve(args.index))
        if(!exists(index_bazar)){
            logger.error('Have no index file : ' + index_bazar)
        }

        console.log('read ' + src)
        console.log('write to ' + dst)
        
        const index = read(src, 'json') as any
        
        console.log('download to ' + dst)

        await pMap(index.vendorUrls, async (i: any) => {
            return crawler(i, dst, i.prefix, index_bazar);
        }, { concurrency: 1 });
    });
};
