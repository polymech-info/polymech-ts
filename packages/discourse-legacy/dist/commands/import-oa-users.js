import { defaults, sanitize } from '../_cli';
import { parse } from '../options';
import { logger } from '../index';
import { Instance } from '../lib/discourse';
import { sync as write } from '@polymech/fs/write';
import { read_users, filter_invalid, filter_email_missing, filter_email_only, importUsers, filter_valid, oa_user_email, getDataPath, updateUsers, indexUsers } from '../lib/oa/users';
import * as path from 'path';
import { resolve } from '@polymech/commons';
const defaultOptions = (yargs) => {
    return yargs.option('debug', {
        default: false,
        describe: 'debug messages',
        type: 'boolean'
    }).option('src', {
        default: '${OA_ROOT}/data/latest.json',
        type: 'string',
    }).option('track', {
        default: '${OSR_ROOT}/osr-directory/pp/merged.json',
        type: 'string',
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path.'
    });
};
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('import-users <verb>', 'Import oa-users', options, async (argv) => {
        defaults();
        if (argv.help) {
            return;
        }
        const args = argv;
        let options = sanitize(argv);
        if (!options) {
            return;
        }
        options.debug && logger.debug(`CLI Args In`, argv);
        let opts = parse(options, args);
        const discourse = Instance();
        const _opts = {
            verb: argv.verb,
            src: path.resolve(resolve(options.src)),
            track: path.resolve(resolve(options.track))
        };
        let users = read_users(_opts.src);
        users = filter_valid(users);
        //////////////////////////
        //
        //  store invalid
        let usersInvalid = read_users(_opts.src);
        usersInvalid = filter_email_only(usersInvalid);
        usersInvalid = filter_invalid(usersInvalid);
        logger.debug('write invalidUsers.json : ', getDataPath('/invalidUsers.json'));
        write(getDataPath('/invalidUsers.json'), usersInvalid.map((u) => {
            return {
                ...u.detail,
                id: u._id,
                email: oa_user_email(u)
            };
        }));
        let usersInvalidEmail = read_users(_opts.src);
        usersInvalidEmail = filter_email_missing(usersInvalidEmail);
        logger.debug('write invalidUsersEMail.json : ', getDataPath('/invalidUsersEMail.json'));
        write(getDataPath('./invalidUsersEMail.json'), usersInvalidEmail.map((u) => {
            return {
                ...u.detail,
                id: u._id
            };
        }));
        logger.debug('invalid users email : ', usersInvalidEmail.length);
        logger.debug('invalid users : ', usersInvalid.length);
        if (opts.verb == 'index') {
            await indexUsers(discourse, options, users);
        }
        if (opts.verb == 'import') {
            await importUsers(discourse, options, users);
        }
        if (opts.verb == 'update') {
            await updateUsers(discourse, options, users);
        }
        return;
    });
};
//# sourceMappingURL=import-oa-users.js.map