import * as CLI from 'yargs';
import { logger } from '../../'
import { IOptions, } from '../../types'

import { VendorSearchAll, VendorSearch, I_OSR_USER, I_USER_SHORT } from '../../lib/types'

const _sanitize = require("sanitize-filename")
const filenamify = require('filenamify')

import * as path from 'path';
import xlsx from 'node-xlsx'

import { CONFIG_DEFAULT } from '@polymech/osr-cli-commons'
import { resolve } from '@polymech/osr-cli-commons/fs'
import { sync as read } from '@polymech/fs/read'
import { sync as write } from '@polymech/fs/write'

//import { searchVendorSA } from '@polymech/osr-search'

import { GoogleParameters } from 'serpapi/types/src/engines/google'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('src', {
        _default: '${OSR_ROOT}/pp-bazar/${YYYY}/${MM}/index_bazar.json',
        default: '${OSR_ROOT}/pp-bazar/2023/05/index_bazar.json',
        describe: 'The source file'
    }).option('debug', {
        default: 'false',
        describe: 'Enable internal debug message'
    })
};

let options = (yargs: CLI.Argv) => defaultOptions(yargs);

// #node .\dist\main.js complete-bazar 

const skip = true


const writerXLS = (_users: any[], dst: string) => {

    let _path = path.resolve(resolve(dst));

    _users = _users.map((u) => {
        return [u.email, u.name, u.bazar, u.web, u.ig];
    })

    let columns = ['EMail', 'Name', 'Bazar', 'Web', 'IG'];

    let data =
        [
            columns,
            ..._users
        ];

    const sheetOptions = { '!cols': [{ wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 40 }] };
    const buffer = xlsx.build([{ name: 'raw', data: data, options: sheetOptions }]);
    write(_path, buffer);
}


export const register = (cli: CLI.Argv) => {

    return cli.command('complete-bazar', '', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return; }

        const config = CONFIG_DEFAULT() as any;
        const src = path.resolve(resolve((argv as any).src));
        let index = read(src, 'json') as any

        /*
        import type { GoogleLocalParameters } from "serpapi";
import { getJson } from "serpapi";

const params = {
  google_domain: "google.es",
  q: "polymech ",
  hl: "es",
  gl: "es",
  location: "Province of Barcelona, Catalonia, Spain"
} satisfies GoogleLocalParameters;

// Show result as JSON
const response = await getJson("google_local", params);
console.log(response);
*/

/*
        for await (const key of Object.keys(index)) {
            const val = index[key];
            if (skip && index[key].search && !index[key].search.error) {
                continue
            }
            logger.debug(`Searching ${key}`);

            let search = await searchVendorSA(key, "Berlin", null, config.serpapi.key);
            index[key] = {
                ...index[key],
                search: search
            }
            write(src, index)
        }*/
        const vendors: VendorSearchAll = index
        const ret: I_USER_SHORT[] = []
        const url_bazar = (v: VendorSearch) => v.url

        const url_ig = (v: VendorSearch) => {

            const ig = v.search.organic_results.filter((u) => {
                return u.link.indexOf('instagram.com') != -1
            })

            return (ig[0] ? ig[0].link : "").replace('?hl=en','')
        }

        const url_web = (name: string, v: VendorSearch) => {
            const others = v.search.organic_results.filter((u) => {
                return !u.link.includes('bazar.') &&
                 !u.link.includes('preciousplastic.com') &&
                 !u.link.includes('instagram.com')
            })
            return others[0] && others[0].link ? others[0].link : ""
        }

        for (const key of Object.keys(vendors)) {
            const val = index[key];
            ret.push({
                name: key,
                bazar: url_bazar(val),
                email: "",
                ig: url_ig(val) as string,
                web: url_web(key, val) as string,
                censored: "",
                lastActive: new Date(),
                social: ""
            })
            let d = 0;
        }

        writerXLS(ret, src.replace('.json', '.xlsx'))

    });
};
