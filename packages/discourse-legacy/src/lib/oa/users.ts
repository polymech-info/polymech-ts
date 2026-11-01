
import { Promise as BPromise } from 'bluebird'
import { I_OSR_USER } from '@polymech/commons'

import { IOptions, IImportUser, IDiscourseUser } from '../../'
import { Discourser } from '../index'
import { getImageName, sanitize } from './lib'

import { capitalize, replace, replaceAll } from '@polymech/core/utils'
import * as path from 'path'
import { sync as read } from '@polymech/fs/read'
import { sync as exists } from '@polymech/fs/exists'
import { sync as write } from '@polymech/fs/write'

import { resolve } from '@polymech/commons'

import { logger } from '../../index'

const slugify = require('slugify')

import { resolveConfig, substitute } from '@polymech/core'

import { html_beautify } from 'js-beautify'
import { sync as mkdir } from '@polymech/fs/dir'
import { files, forward_slash } from '@polymech/commons'
import { Converter } from 'showdown'
const URI = require("uri-js")

import {
    OA_USER_IMPORT_GROUP,
    LATEST_TEST,
    LATEST_TRACK,
    FETCH_DUSERS,
    F_USERS_ALL,
    F_USERS_NOW,
    DEFAULT_PASSWORD,
    DATA_PATH,
    HT_CATS,
    OA_DIRECTORY_OVERVIEW_TOPIC
} from '../discourse/constants'

import { IOSRConfig } from '@polymech/commons'


const filenamify = require('filenamify')
const fg = require('fast-glob')


const TEST = false



export const read_users = (src: string): I_OSR_USER[] => {
    const raw = read(src, 'json') as any
    return raw.v3_mappins.filter((f) => f.data != null)
}

export const filter_valid = (users: IImportUser[]) => {
    return users.filter((user) => {
        if (!user.data) {
            return false
        }
        if (!user.geo) {
            return false
        }

        if (!user.data.urls) {
            return false
        }

        if (!user.data.title) {
            return false
        }

        if (!user.detail) {
            return false
        }

        if (!user.detail.heroImageUrl) {
            return false
        }

        if (user.data && user.data.jsError) {
            return false
        }

        if (user.moderation !== 'accepted') {
            //return false
        }

        return true;
    })
}

export const filter_email_only = (users: any[]) => {
    return users.filter((user) => {
        if (!user.data) {
            return false;
        }
        if (!user.geo) {
            return false;
        }
        if (!user.data.urls) {
            return false;
        }
        if (user.data && user.data.jsError) {
            return false;
        }

        if (!user.detail) {
            return false
        }

        if (!user.detail.name) {
            return false
        }

        if (user.data.urls.find((l) => l.name == 'Email') == undefined) {
            return false;
        }
        return true;
    })
}

export const filter_invalid = (users: any[]) => {

    return users.filter((user) => {
        if (!user.data) {
            return false;
        }
        if (!user.geo) {
            return false;
        }
        if (!user.data.urls) {
            return false;
        }
        if (user.data && user.data.jsError) {
            return false;
        }


        if (!user.detail.name) {
            return true
        }

        if (user.data.urls.find((l) => l.name == 'Email') == undefined) {
            return true;
        }

        if (user.moderation !== 'accepted') {
            return true;
        }

        return false;
    })
}

export const filter_email_missing = (users: any[]) => {

    return users.filter((user) => {
        if (!user.data) {
            return false;
        }
        if (!user.geo) {
            return false;
        }
        if (!user.data.urls) {
            return false;
        }
        if (user.data && user.data.jsError) {
            return false;
        }
        if (!user.detail) {
            return false
        }

        if (!user.detail.name) {
            return false
        }

        if (user.moderation !== 'accepted') {
            return false;
        }
        if (!user.data.urls.find((l) => l.name == 'Email')) {
            return true;
        }
        return false;
    })
}

export const filter_accepted = (users: IImportUser[]) => {
    return users.filter((user) => {
        if (!user.data) {
            return false
        }
        if (!user.geo) {
            return false
        }
        if (!user.data.urls) {
            return false
        }

        if (!user.detail.heroImageUrl) {
            return false
        }

        if (user.data && user.data.jsError) {
            return false
        }

        if (user.moderation !== 'accepted') {
            return false
        }

        return true;
    })
}

export const oa_user_email = (user: I_OSR_USER) => {
    if (!user.data) {
        return false;
    }
    if (!user.geo) {
        return false;
    }
    if (!user.data.urls) {
        return false;
    }
    if (user.data && user.data.jsError) {
        return false;
    }
    let u = user.data.urls.find((l) => l.name == 'Email')
    if (u) {
        return u.url.replace('mailto:', '')
    }

}

export const get_user_name = (user: IImportUser) => {
    let ret = replaceAll('--', '-', sanitize(filenamify(user._id)).replace(/^\-+/g, '').replace(/\-$/, ''))

    ret = ret.replace(/\-$/, '')
    ret = ret.replace(/\_$/, '')

    if (!oa_user_email(user)) {
        ret += '-uc'
    }

    return ret
}

export const get_user_display_name = (user: IImportUser) => replaceAll('--', '-', sanitize(filenamify(user.data.title)).replace(/^\-+/g, '').replace(/\-$/, ''));

export const getDataPath = (_path = '') => path.resolve(path.join(resolve(DATA_PATH), _path))

export const getUsersPath = () => path.resolve(resolve(TEST ? LATEST_TEST : LATEST_TRACK))

export const getUsers = () => (read(path.resolve(getUsersPath()), 'json') as any) as IImportUser[] || []

let uPage = 1
let usersAll = []

export const _getForumUsers = async (d: Discourser, page, detail) => {

    if (uPage == 1) {
        usersAll = []
    }
    let users: any = await d.getUsers(page);
    if (users.length) {
        usersAll = usersAll.concat(users);
        uPage++;
        return _getForumUsers(d, uPage, detail);
    } else {
        uPage = 1;

        write(path.resolve(F_USERS_NOW), usersAll);

        let fUsers: IDiscourseUser[] = read(path.resolve(F_USERS_ALL), 'json') || [] as any;

        const add = async (u: IDiscourseUser) => {
            return new Promise((resolve, reject) => {
                let fUser = fUsers.find((fu) => u.id == fu.id)
                if (!fUser) {
                    fUsers.push(u)
                    fUser = u
                }

                if (!fUser.detail) {
                    logger.debug('Retrieve User Detail ' + u.name)
                    setTimeout(() => {
                        d.getUser(fUser.id).then((detail) => {
                            if (detail) {
                                fUser.detail = detail
                            }
                            write(path.resolve('./fusers-all.json'), fUsers)
                            resolve(fUser)
                        })
                    }, 200)
                } else {
                    resolve(fUser)
                }
            })
        }
        return await BPromise.resolve(usersAll).map((u: IDiscourseUser) => {
            return add(u)
        }, { concurrency: 1 })

    }
}
export const getForumUsers = async (d, detail): Promise<IDiscourseUser[]> => {
    if (!FETCH_DUSERS) {
        return read(getDataPath(F_USERS_ALL), 'json') || [] as any
    }
    return _getForumUsers(d, uPage, detail)
}

export const createUser = async (discourse: Discourser, oa_user: IImportUser) => {
    /*
    Bazar
    https://shop.osr-plastic.org
    Website
    website2
    Instagram
    https://www.instagram.com/osr_plastic/
    Directory / Map Url
    https://www.google.com/maps/contrib/117674167598277014013
    OSR - Marketplace Url
    https://shop.osr-plastic.org/plastichub/
    */
    if (!oa_user.data.title) {
        return -120
    }

    let name = replaceAll('--', '-', get_user_display_name(oa_user).replace(/^\-+/g, '').replace(/\-$/, ''))
    let user_name = get_user_name(oa_user)

    name = user_name.replace(/\-$/, '')
    name = user_name.replace(/\_$/, '')

    let opts = {
        "name": name,
        "email": oa_user_email(oa_user) || `${user_name}_uc@osr-plastic.org`,
        "password": DEFAULT_PASSWORD(),
        "username": user_name,
        "active": true,
        "approved": true,
        "user_fields[1]": true
    }

    let user: any = await discourse.createUser(opts)

    if (name.length < 4) {
        return -120
    }

    if (user_name.length > 50) {
        return -120
    }

    if (user && user.errors) {


        if (user.message === "Username must be no more than 50 characters" ||
            user.message === 'Username must not contain a sequence of 2 or more special chars (.-_)') {
            return -120
        }

        if (user.message === "Username must be unique" || user.message === "Primary email has already been taken") {
            return -100
        }

        if (user.errors.email && user.errors.username) {
            user = await discourse.getUserByUsername(user_name)
            if (user && user.id && !oa_user._didSetGroup) {
                try {
                    let gret = await discourse.updateGroup(user_name, OA_USER_IMPORT_GROUP);
                } catch (e) {
                    logger.error('error adding to group', user_name)
                }
                return user.id
            };
        }
        logger.error('Error creating user ' + user_name, user.errors)
    }
    if (user && user.user_id) {
        try {
            await discourse.updateGroup(user_name, OA_USER_IMPORT_GROUP);
            return user.user_id;
        } catch (e) {
            logger.error('error adding to group', user_name)
            return user.user_id;
        }

    } else {
        if (user && user.message && user.message == 'Username must be unique\nPrimary email has already been taken') {
            logger.error('already created', oa_user.detail.name)
            return -10;
        } else if (user && user.message && user.message == 'Your account is activated and ready to use.') {
            if (user.user_id) {
                return user.user_id;
            }
            return -10;
        } else {
            logger.debug('cant create user ' + oa_user.detail.name, user);
        }
        return null;
    }
    return null;
}

export const uploadAvatar = async (discourse, name, filePath) => {
    const users = getUsers()
    const index = users.findIndex((u) => u.detail.name == name)
    try {
        const upped = await discourse.upload(1, filePath)
        const data = upped.data

        if (data && data.id) {
            users[index].upload_id = data.id
            logger.debug('uploaded avatar ' + name + ' ' + data.id)
            write(getUsersPath(), users)
        } else {
            logger.error('upload - error', name)
        }
        return users
    } catch (error) {
        users[index].upload_id = -1
        logger.error('error uploading avatar', name)
        write(getUsersPath(), users)
    }

}

const uploadAvatars = async (discourse: Discourser, users: IImportUser[]) => {

    const toBeUploaded = users.filter((u) => {
        if (u.upload_id) {
            return false
        }

        const hero = getImageName(u.detail.heroImageUrl)
        const avatar = findAvatar(u, hero)
        if (!avatar) {
            logger.error('cant find avatar : ', u._id, hero)
            return false
        }
        u.avatar = avatar
        return true
    })

    return await BPromise.resolve(toBeUploaded).map((u: IImportUser) => {
        if (!u.detail.name) {
            return
        }
        logger.debug('upload avatar : ' + u._id)
        const t = uploadAvatar(discourse, u.detail.name, u.avatar)
        return t;
    }, { concurrency: 1 })

}

const findAvatar = (user: IImportUser, filename) => {

    const root = path.resolve(resolve(DATA_PATH))

    const _path = path.resolve(`${root}/${user._id}/${filename}`)
    if (exists(_path)) {
        return _path
    }
    const files = fg.sync('**/**/*' + filename + '*', { dot: true, cwd: root, absolute: true });
    if (files.length == 0) {
        return false;

    }
    return files[0];
}

/////////////////////////////////////////////////////
//
//  users
//
export const updateUser = async (discorse: Discourser, oa_user: IImportUser) => {

    const users = getUsers()

    const index = users.findIndex((u) => u.detail.name == oa_user.detail.name)

    const user_name = replaceAll('--', '-', get_user_name(oa_user).replace(/^\-+/g, '').replace(/\-$/, ''))

    let ret: any = null;

    try {

        ret = await discorse.updateUser(user_name, {
            name: oa_user.data.title
        })


        try {

            let location
            if (oa_user.geo) {
                location = `${oa_user.geo.continent} / ${oa_user.geo.countryName} / ${oa_user.geo.city} `
            }


            let website
            if (oa_user.data) {
                website = oa_user.data.urls.find((l) => l.name == 'Website')
                if (website) {
                    website = website.url
                }
            }


            let description
            if (oa_user.data) {
                if (oa_user.data.description) {
                    description += oa_user.data.description
                }

                description += '\n'

                if (oa_user.data.services) {
                    let services = `### Services \n`;
                    let hasServices = false;
                    for (let s in oa_user.data.services[0]) {
                        if (oa_user.data.services[0][s]) {
                            services += `- [x] ${capitalize(s)}\n`
                            hasServices = true;
                        }
                    }
                    if (hasServices) {
                        description += services
                    }
                }
            }

            let links = ''
            if (oa_user.data.urls) {
                links = oa_user.data.urls.filter(

                    (r) => r.name !== 'Bazar' && r.name !== 'sponsor the work'

                ).map((l) => {
                    let label = '' + l.name;

                    if (label === 'Social media') {
                        if (l.url.indexOf('facebook') !== -1) {
                            label = 'Facebook';
                        }
                        if (l.url.indexOf('instagram') !== -1) {
                            label = 'Instagram';
                        }
                    }

                    label += " - " + l.url;
                    label = label.replace("https://", "");
                    label = label.replace("http://", "");
                    label = label.replace("mailto:", "");

                    return `<a href="${l.url}">${label}</a>`
                }).join("<br/>\n")

                description += '\n### Links\n'
                description += links
            }

            if (oa_user.location) {
                description += `\n\n <a href="https://www.google.com/maps/search/${oa_user.location.lat},${oa_user.location.lng}">Get Directions</a>\n`
            }


            let updatePrefs = await discorse.updateUserProfile(user_name, {
                bio_raw: replaceAll('undefined', '', description),
                location,
                website
            })


        } catch (error) {
            logger.error(`Error updating user prefs : ${user_name}`)
        }

    } catch (error) {
        logger.error('error updating user', oa_user._id, error.message)
        return
    }


    if (ret.status === 200) {
        users[index].didUpdateName = true
        logger.debug('did update user', oa_user._id, ' #  ', oa_user.data.title)
        write(getUsersPath(), users)
    } else {
        logger.error('did update user failed ', oa_user._id)
    }
}
export const importUser = async (discorse: Discourser, oa_user: IImportUser) => {

    const users = getUsers()

    const index = users.findIndex((u) => u._id == oa_user._id)

    let user = null

    try {
        user = await createUser(discorse, oa_user)
    } catch (error) {
        debugger
        logger.error('error creating user', error)
        return false
    }

    if (user === -100) {
        users[index].alreadyExists = true
        write(getUsersPath(), users)
        return
    }

    if (user === -120) {
        users[index].invalidData = true
        write(getUsersPath(), users)
        return
    }


    if (user && users[index].upload_id && !users[index]._didSetAvatar) {
        try {
            await discorse.setUserAvatar(get_user_name(oa_user), users[index].upload_id)
        } catch (e) {
            logger.error('error setting avatar', get_user_name(oa_user))
        }
    }

    const _t = users[index];

    if (user > 0) {
        users[index].f_id = user
        users[index]._didSetAvatar = true
        users[index]._didSetGroup = true
        logger.debug('\t created ' + oa_user.data.title)
        write(getUsersPath(), users)
    } else {
        logger.error('cant create user - error', oa_user.detail.name, user)
    }
    return users[index]
}

export const mergeLatestUsers = (discorse, options: IOptions, oa_users: I_OSR_USER[]): IImportUser[] => {
    const users: any[] = getUsers()
    oa_users.forEach((u) => {
        const tUser = users.find((tu) => {
            return tu._id === u._id
        })
        if (!tUser) {
            users.push(u)
        }

    })
    logger.debug(`Merged users to ${getUsersPath()}`)
    write(getUsersPath(), users)
    return users
}

export const mergeLatestUsersTest = (discorse, options: IOptions, oa_users: I_OSR_USER[]): IImportUser[] => {
    const users: any[] = (read(LATEST_TEST, 'json') as [] || [])
    oa_users.forEach((u) => {
        const tUser = users.find((u) => {
            return u._id === u._id
        })
        if (!tUser) {
            users.push(u)
        }
    })
    write(options.track, users)
    return users
}

export const importUsers = async (discorse, options: IOptions, oa_users: I_OSR_USER[]) => {

    logger.debug('read users from ', path.resolve(getUsersPath()))

    let users = mergeLatestUsers(discorse, options, oa_users)
    //const users = mergeLatestUsersTest(discorse, options, oa_users)

    users = users.filter((u) => {
        if (u.f_id || u.f_id < 0) {
            return false;
        }
        if (u.detail.name === 'plastichub' || u.detail.name === 'lu' || u.detail.name === 'timberstar' || u.detail.name === 'nickname') {
            return false
        }
        if (u.alreadyExists || u.invalidData) {
            return false;
        }
        return true
    })

    logger.debug('Create Users ' + users.length + ' Total | Left: ' + users.length)

    await uploadAvatars(discorse, users)

    return await BPromise.resolve(users).map((u: IImportUser) => {
        logger.debug('import user ' + get_user_name(u))
        try {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const d = importUser(discorse, u)
                    if (d) {
                        d.then(resolve)
                    } else {
                        reject()
                    }
                }, 500)

            })

        } catch (e) {
            debugger;
            logger.error('error creating user ' + u._id, e)
        }
    }, { concurrency: 1 })

}

export const updateUsers = async (discorse, options: IOptions, oa_users: I_OSR_USER[]) => {
    // https://forum.osr-plastic.org/u/easymoulds/preferences/profile            
    const users = mergeLatestUsers(discorse, options, oa_users)
    //const users = mergeLatestUsersTest(discorse, options, oa_users)

    let toBeCreated = users.filter((u) => {
        if (u.f_id || u.f_id < 0) {
            return true;
        }
        if (u.didUpdateName) {
            return false
        }
        return true
    })

    const testUser = 'easymoulds'

    const test = toBeCreated.find((u) => {
        return u._id === testUser
    })

    // toBeCreated = [test]

    return await BPromise.resolve(toBeCreated).map((u: IImportUser) => {
        /*
        if (u.didUpdateName) {
            return false
        }
        */

        try {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const d = updateUser(discorse, u)
                    if (d) {
                        d.then(resolve)
                    } else {
                        reject()
                    }
                }, 200)

            })

        } catch (e) {
            debugger;
            logger.error('error creating user ' + u._id, e)
        }
    }, { concurrency: 1 })
}

export const md_edit_wrap = (content, f, prefix = '', context = '') => {
    return html_beautify(`<div prefix="${prefix}" file="${path.parse(f).base}" context="${context}" class="fragment">${content}</div>`);
}
export const toHTML = (path, markdown) => {
    const content = read(path, 'string') as string;
    if (!markdown) {
        let converter = new Converter({ tables: true });
        converter.setOption('literalMidWordUnderscores', 'true');
        return converter.makeHtml(content);
    } else {
        return content;
    }
}
export const imageName = (url) => {
    if (!url) {
        return ""
    }
    try {
        const parsed = URI.parse(decodeURIComponent(url));
        const pParsed = path.parse(parsed.path);
        return sanitize(decodeURIComponent(pParsed.base));
    } catch (error) {
        logger.error('error image name : ', url)
        return ""
    }
}
export const read_fragments = (src, config, prefix = '', context = '') => {

    if (!exists(src)) {
        //debug.warn(`Create template folder ${src}`);
        mkdir(src);
    }
    let fragments = files(src, '*.html');
    fragments.map((f) => {
        config[path.parse(f).name] = md_edit_wrap(toHTML(f, true), f, prefix, context);
    });

    fragments = files(src, '*.md');
    fragments.map((f) => {
        config[path.parse(f).name] = md_edit_wrap(toHTML(f, false), f, prefix, context);
    });
    return config;
}

export const indexUsers = async (discorse, options: IOptions, oa_users: I_OSR_USER[]) => {

    let users = mergeLatestUsers(discorse, options, oa_users)

    users = users.filter((u) => {
        if (u.f_id && u.data && u.geo) {
            return true;
        }
        return false
    })

    const continents = []
    const countries = []
    const navIndex: any[] = []

    users.forEach((u) => {
        if (!u.geo || !u.data || u.data.jsError || !u.detail || !u.detail.heroImageUrl) {
            return;
        }
        if (!u.detail.heroImageUrl) {
            return;
        }
        let code = null;

        if (u.geo.continent && continents.indexOf(u.geo.continent) == -1) {
            continents.push(u.geo.continent);
            navIndex.push({
                title: u.geo.continent,
                url: `/users/${slugify(u.geo.continent)}.html`,
                children: [],
                code: u.geo.continentCode
                // code:u.geo.continentCode
            })
        }

        if (countries.indexOf(u.geo.countryName) == -1) {
            countries.push(u.geo.countryName);
        }
        const c = navIndex.find((c) => c.title === u.geo.continent);
        if (c) {
            const cc = c.children.find((i) => i.title == u.geo.countryName);
            if (!cc) {
                c.children.push({
                    title: u.geo.countryName,
                    url: `/users/${slugify(c.title)}.html#${slugify((u.geo.countryName as string).toLocaleLowerCase())}`,
                    postTitle: `Directory - ${u.geo.countryName}`
                })
            }
        }
    });

    navIndex.sort((a, b) => {
        if (a.title < b.title) { return -1; }
        if (a.title > b.title) { return 1; }
        return 0;
    });

    navIndex.forEach((c) => {
        c.children.sort((a, b) => {
            if (a.title < b.title) { return -1; }
            if (a.title > b.title) { return 1; }
            return 0;
        });
    });

    const directoryRoot = path.resolve(resolve('${OSR_ROOT}/osr-directory/pp'))

    const createContinentPage = (continent) => {

        const templates_path = path.resolve(`${directoryRoot}/templates`);
        if (!exists(templates_path)) {
            logger.error(`\t Cant find templates at ${templates_path}, path doesn't exists`);
            return;
        }
        const cPath = path.resolve(`${directoryRoot}/templates/config.json`)
        const config = read(cPath, 'json') as IOSRConfig
        let fragments: any = { ...config }

        read_fragments(templates_path, fragments, "product_rel_path_name", "machine");

        let templateCountry = read(path.resolve(`${templates_path}/country_users.md`), 'string');
        const ccountries = {};

        let code = null;


        users.forEach((u) => {

            if (!u.geo || !u.data || u.data.jsError || !u.detail || !u.detail.heroImageUrl) {
                return;
            }
            if (!u.detail.heroImageUrl) {
                return;
            }
            if (u.geo.continent && u.geo.continent === continent) {
                if (!code) {
                    code = u.geo.continentCode;
                }
                if (!ccountries[u.geo.countryName]) {
                    ccountries[u.geo.countryName] = [];
                }

                ccountries[u.geo.countryName].push(u);
            }
        });

        if (continent === 'Africa') {
            //debugger;
        }

        let weight = 100;
        for (var country in ccountries) {

            let cPage = "";

            if (country === 'Kenya') {
                //debugger;
            }

            cPage += `\n#### ${slugify(country)}\n\n`;
            if (country === 'undefined' || country === 'unknown' || !country) {
                return;
            }
            cPage += '<div class="container">';
            cPage += '<div class=""><div class="col-12"><div class="list-group">';

            let cusers = ccountries[country];
            cusers = cusers.sort((a, b) => a.type === b.type ? 1 : -1);
            const cUsersC = cusers.map((u) => {
                const prefix = u.moderation === 'rejected' ? "<span style='color:red'>Censored</span>" : "";
                const image = `/users/${u._id}/${encodeURIComponent(sanitize(imageName(u.detail.heroImageUrl)))}`;
                const title = u.data && u.data.title ? u.data.title : u._id;
                const uUrl = `/directory/users/${u._id}`;
                let censored = u.moderation === 'rejected' ? '<span class="text-danger">Yes</span>' : 'No'
                return `<div class="list-group-item d-flex align-items-center">
                    <a href="${uUrl}">
                    <img loading=lazy src="${image}" class="text-info mx-2 personLogo"/></a>
                    <div class="">
                    <a href="${uUrl}">${title}</a><br/>
                    <span>Type: ${u.type}</span><br/>
                    <span>Censored: ${censored}</span>
                    <br/>
                    <span class="personLocationInfo">   ${u.geo.principalSubdivision} / ${u.geo.locality} - ${u.geo.principalSubdivisionCode} - ${u.geo.postcode}</span>
                    </div>
                </div>`;
            })
            cPage += cUsersC.join('');
            cPage += '</div></div></div></div>';

            country = country.replace(' (the)', '');

            /*
            const cPagePath = path.resolve(`${kb}/src/directory/users_${sanitize(slugify(country))}-${code}.md`)

            const title = 'Users - ' + country;

            cPage = substitute(templateCountry, {
                ...fragments,
                title: title,
                keywords: 'Precious Plastic, Precious Plastic Users - ' + country,
                content: html_beautify(cPage),
                continent: slugify(continent),
                country: slugify(country),
                identifier: country + "-" + continent,
                weight: weight
            });

            weight++;
            write(cPagePath, cPage);
            console.log('write ' + cPagePath);
            */
        }


        /*
        content = substitute(template, {
            ...fragments,
            title: 'Precious Plastic - Users ' + continent,
            keywords: 'Precious Plastic, Precious Plastic Users - ' + continent,
            content: content,
            continent: slugify(continent)
        });
        */

        //const index_md = path.resolve(`${root}/_pages/users_${code}.md`);
        //write(index_md, content);
    }

    const templates_path = path.resolve(`${directoryRoot}/templates`);

    const createCountryPages = async (index: any[], indexPath: string) => {
        let i = 0;
        for await (const continent of index) {
            const countries = continent.children
            for await (const country of countries as any) {
                const d = 0
            }

        }
    }

    await createCountryPages(navIndex, './')

    const createIntroPage = async (users, index: any[], dst: string) => {

        let template = read(path.resolve(`${templates_path}/intro_users.md`))

        let content = ""

        const usersPerCountry = (country: string) => {
            return users.filter((u) => u.geo.countryName === country)
        }

        index.forEach((i) => {
            const heading = `## ${i.title}`
            let countries = ''
            i.children.forEach((c) => {
                let title = c.title.replace(/ *\([^)]*\) */g, "")
                const nb = usersPerCountry(c.title).length
                title = `${title} \(${nb}\)`
                const cPagePath = `/directory/users_${sanitize(slugify(c.title))}-${i.code}`
                countries += `- [${(title)}](${cPagePath.toLowerCase()})\n`
            })
            content += `${heading}\n ${countries}`
        })

        write(dst, substitute(template, {
            content: content,
            /*hidden: data.v3_mappins.filter((u) => u.moderation !== "accepted").length,
            total: data.v3_mappins.length*/
        }))

        let data: any
        try {
            data = await discorse.updatePost(OA_DIRECTORY_OVERVIEW_TOPIC, content)
            debugger
            //logger.debug('update post : ' + options.title + ' :  ' + data.id + ' | topic id ' + data.topic_id)
        } catch (e) {
            return false
        }

    }

    // await createIntroPage(users, navIndex, './index.md')


    /*

    return await BPromise.resolve(users).map((u: IImportUser) => {        
        try {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const d = updateUser(discorse, u)
                    if (d) {
                        d.then(resolve)
                    } else {
                        reject()
                    }
                }, 200)

            })

        } catch (e) {
            debugger;
            logger.error('error creating user ' + u._id, e)
        }
    }, { concurrency: 1 })

    */
}