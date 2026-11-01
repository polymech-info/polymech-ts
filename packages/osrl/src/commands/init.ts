import * as CLI from 'yargs';
import { logger } from '../index';
import { defaultOptions } from '../_cli';
import { read  } from '../lib/net/sheets'

let options = (yargs: CLI.Argv) => defaultOptions(yargs);

// node ./main.js init google-sheets --sheet='1oVEiGH4o3SV-mAA3Mb-WNVJMyYl4VMxLjWjrSw_ipJY' --range='Parts!B4:B5'

const initGSheets = async (sheet, range) =>{
    return read(sheet,range)
}

export const register = (cli: CLI.Argv) => {
    return cli.command('init <verb>', 'Initialize specific language features', options, async (argv: CLI.Arguments) => {
        if (argv.help) {
            return;
        }
        const verb = argv.verb;
        if(!verb){
            logger.error(`You need to specify a verb`);
        }

        if(verb==='google-sheets'){
            const sheet = argv.sheet;
            const range = argv.range;
            initGSheets(sheet,range).then((d)=>{
                logger.info('done google auth | sheet result', d );
            })
        }        
    });
};
