import * as CLI from 'yargs';
import { crawler } from './crawlerBazar.js';
import * as path from 'path';
import { sync as exists } from '@polymech/fs/exists';
import { sync as dir } from '@polymech/fs/dir';
import { sync as rm } from '@polymech/fs/remove';

import pMap from 'p-map'
import { resolve } from '@polymech/commons'

import {
    bazar_root_path
} from './lib.js'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('dst', {
        default: bazar_root_path(),
        describe: 'The dst directory'
    }).option('debug', {
        default: 'false',
        describe: 'Enable internal debug message'
    }).option('hq', {
        default: true,
        describe: 'Download high res images'
    })
};

let options = (yargs: CLI.Argv) => defaultOptions(yargs);

// #node .\dist\main.js bazar-download --dst="../pp-bazar/2023"

export const register = (cli: CLI.Argv) => {
    return cli.command('bazar-download', '', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return; }
        process.env['APIFY_LOCAL_STORAGE_DIR'] = '.'
        rm(path.resolve('./request_queues'))
        const args = argv as any
        const dst = path.resolve(resolve(args.dst))
        if (!exists(dst)) {
            dir(dst)
        }
        console.log('download to ' + dst)
        let mapDebug = [
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder/shredder-parts/',
                prefix: 'machines/shredder/shredder-parts'
            }
        ]

        const mapShredders = [
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder/shredder-parts/',
                prefix: 'machines/shredder/shredder-parts'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder/shredder-kits/',
                prefix: 'machines/shredder/shredder-kits'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder/shredder-fully-built/',
                prefix: 'machines/shredder/shredder-fully-built'
            },

            {
                url: 'https://bazar.preciousplastic.com/machines/shredder-pro/shredder-pro-parts/',
                prefix: 'machines/shredder-pro/shredder-pro-parts/'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder-pro/shredder-pro-kits/',
                prefix: 'machines/shredder-pro/shredder-kits'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder-pro/shredder-pro-fully-built/',
                prefix: 'machines/shredder-pro/shredder-fully-built'
            }
        ]

        const mapProducts = [
            {
                url: 'https://bazar.preciousplastic.com/products/household/',
                prefix: 'products/household'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/furniture/',
                prefix: 'products/funiture'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/art-pieces/',
                prefix: 'products/art'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/lightning/',
                prefix: 'products/lighting'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/accessories/',
                prefix: 'products/accessories'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/other/',
                prefix: 'products/other'
            }];

        const mapInjection = [
            {
                url: 'https://bazar.preciousplastic.com/machines/injection/injection-parts/',
                prefix: 'machines/injection/parts'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/injection/injection-kits/',
                prefix: 'machines/injection/kits'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/injection/injection-fully-built/',
                prefix: 'machines/injection/built'
            }
        ];

        const mapMaterial = [
            {
                url: 'https://bazar.preciousplastic.com/raw-material/plastic/',
                prefix: 'machines/material/plastic'
            },
            {
                url: 'https://bazar.preciousplastic.com/raw-material/beams/',
                prefix: 'products/beams'
            },
            {
                url: 'https://bazar.preciousplastic.com/raw-material/sheets/',
                prefix: 'products/sheets'
            }
        ];


        const mapMoulds = [
            {
                url: 'https://bazar.preciousplastic.com/moulds/injection-moulds/',
                prefix: 'moulds/injection'
            },
            {
                url: 'https://bazar.preciousplastic.com/moulds/compression-moulds/',
                prefix: 'moulds/compression'
            },
            {
                url: 'https://bazar.preciousplastic.com/moulds/extruder-moulds/',
                prefix: 'moulds/extruder'
            },
        ]
    
        const mapExtruders = [
            {
                url: 'https://bazar.preciousplastic.com/machines/extruder/extruder-parts/',
                prefix: 'machines/extruder-parts'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/extruder/extruder-kits/',
                prefix: 'machines/extruder-kits'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/extruder/extruder-fully-built/',
                prefix: 'machines/extruder-fully-built'
            },
        ]

        const mapExtrudersPro = [
                {
                    url: 'https://bazar.preciousplastic.com/machines/extruder-pro-/extruder-pro-parts/',
                    prefix: 'machines/extruder-parts-pro'
                },
                {
                    url: 'https://bazar.preciousplastic.com/machines/extruder-pro/extruder-pro-kits/',
                    prefix: 'machines/extruder-kits-pro'
                },
                {
                    url: 'https://bazar.preciousplastic.com/machines/extruder-pro/extruder-pro-fully-built/',
                    prefix: 'machines/extruder-fully-built-pro'
                },
        ]
        const mapSheetpress = [
            {
                url: 'https://bazar.preciousplastic.com/machines/sheetpress/sheet-press-fully-built/',
                prefix: 'machines/sheet-press-fully-built'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/sheetpress/sheet-press-parts/',
                prefix: 'machines/sheetpress-parts'
            }, {
                url: 'https://bazar.preciousplastic.com/machines/sheetpress/sheet-press-kits/',
                prefix: 'machines/sheetpress-kits'
            },


        ]

        const all = [
            ...mapShredders,
            ...mapProducts,
            ...mapInjection,
            ...mapMaterial,
            ...mapSheetpress,
            ...mapMoulds,
            ...mapExtruders,
            ...mapExtrudersPro
        ]

        await pMap(all, async (i: any) => {
            return crawler(i.url, dst, i.prefix,{
                hq: args.hq
            });
        }, { concurrency: 1 });
    });
};
