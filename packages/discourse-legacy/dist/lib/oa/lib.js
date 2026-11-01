const _sanitize = require("sanitize-filename");
const URI = require("uri-js");
import * as path from 'path';
const filenamify = require('filenamify');
var TurndownService = require('turndown');
export const sanitize = (f) => {
    let str = filenamify(_sanitize(f)).replace(/[^\x00-\x7F]/g, "");
    if (str.startsWith('_')) {
        str = str.substring(1);
    }
    return str;
};
export const getImageName = (url) => {
    const parsed = URI.parse(decodeURIComponent(url));
    const pParsed = path.parse(parsed.path);
    const fileName = sanitize(decodeURIComponent(pParsed.base));
    return fileName;
};
export const convert = (input) => {
    var turndownService = new TurndownService();
    return turndownService.turndown(input);
};
/*


const getFUser = (users, user_name) => {
    return users.find((u) => {
        return u.name == user_name
    })
}


const indexUsers = async (d, forum: string, detail) => {

    const forumUsers = await getForumUsers(d, detail)
    const raw = (read(path.resolve(forum + '/index.json'), 'json') as any)
    const users_raw = raw.users
    let users = []
    for (let u in users_raw) {
        const user = users_raw[u];
        const avatar = getOAvatar(raw, u);
        let aFileName = '';
        let fUser = getFUser(forumUsers, u);
        if (avatar) {
            const parsed = URI.parse(avatar);
            const pParsed = path.parse(parsed.path);
            aFileName = pParsed.base;
        }
        users.push({
            name: u,
            avatar: avatar,
            avatarFileName: aFileName,
            user_id: fUser ? fUser.id : -1
        });
    }
    write(path.resolve(forum + '/user.json'), users);
}

const _createUser = async (discorse, forum, name, email) => {

    const users = getUsers()
    const index = users.findIndex((u) => u.detail.name == name)
    let user = await createUser(discorse, null)


    if (user && users[index].upload_id) {
        await discorse.setUserAvatar(name, users[index].upload_id);
        //return users;
    }

    if (user > 0 && index) {
        users[index].f_id = user;
        console.log('created ' + name + ' ' + user);
        write(getUsersPath(), users);
    } else {
        console.error('cant create user - error', name, user)
    }
}


const _updateGroup = async (discorse, forum, name, id, forumUsers) => {
    const users = (read(path.resolve(forum + '/user.json'), 'json') as any);
    const index = users.findIndex((u) => u.name == name);
    try {
        const d = await discorse.updateGroup(name, pUserGroup);
        console.log('updated user group for ' + name);
        users[index].g_id = pUserGroup;
        write(path.resolve(forum + '/user.json'), users);
        if (users[index].upload_id) {
            //await discorse.setUserAvatar(name, users[index].upload_id);
        }
    } catch (e) {
        if (e.data && e.data.status == 422) {
            users[index].g_id = pUserGroup;
            write(path.resolve(forum + '/user.json'), users);
            console.log('updated user group for ' + name);
        }
    }
}

const _updateAvatar = async (discorse, forum, name) => {
    const users = (read(path.resolve(forum + '/user.json'), 'json') as any);
    const index = users.findIndex((u) => u.name == name);
    return new Promise((resolve, reject) => {
        try {
            setTimeout(() => {
                discorse.setUserAvatar(name, users[index].upload_id).then(() => {
                    console.log('updated avatar for ' + name);
                    users[index].avatarSet = true;
                    write(path.resolve(forum + '/user.json'), users);
                    resolve(1);
                });
            }, 200);
        } catch (e) {
            console.error('-error setting avatar', e);
            debugger;
        }
    });
}


const createUsers = async (d, forum) => {

    const forumUsers = await getForumUsers(d, true)
    const users = (read(path.resolve(forum + '/user.json'), 'json') as any);
    const toBeCreated = users.filter((u) => {
        if (u.f_id || u.f_id < 0) {
            return false;
        }
        if (u.name === 'plastichub' || u.name === 'lu' || u.name === 'timberstar' || u.name === 'nickname') {
            return false
        }
        return true;
    });

    console.log('Create Users ' + users.length + ' Total | Left: ' + toBeCreated.length);

    return await BPromise.resolve(toBeCreated).map((u: any) => {
        const t = _createUser(d, forum, u.name, u.email);
        return t;
    }, { concurrency: 1 })

}

const updateUserGroups = async (forum) => {
    const forumUsers = (read(path.resolve(forum + '/fusers.json'), 'json') as any);
    const users = (read(path.resolve(forum + '/user.json'), 'json') as any);
    const toBeUpdated = users.filter((u) => {
        if (u.g_id) {
            return false;
        }
        if (u.name === 'plastichub' || u.name === 'lu' || u.name === 'timberstar' || u.name === 'nickname') {
            return false
        }
        return true;
    });
    const d = getDiscourse();
    console.log('Update Users ' + users.length + ' Total | Left: ' + toBeUpdated.length);
    return await BPromise.resolve(toBeUpdated).map((u: any) => {
        const t = _updateGroup(d, forum, u.name, u.f_id, forumUsers);
        return t;
    }, { concurrency: 1 })

}

const updateUserAvatars = async (forum) => {
    const users = (read(path.resolve(forum + '/user.json'), 'json') as any);
    const toBeUpdated = users.filter((u) => {
        if (!u.upload_id) {
            return false;
        }

        if (u.avatarSet) {
            return false;
        }

        if (u.name === 'plastichub' || u.name === 'lu' || u.name === 'timberstar' || u.name === 'nickname') {
            return false
        }
        return true;
    });
    const d = getDiscourse();
    console.log('Update User Avatar ' + users.length + ' Total | Left: ' + toBeUpdated.length);
    return await BPromise.resolve(toBeUpdated).map((u: any) => {
        const t = _updateAvatar(d, forum, u.name);
        return t;
    }, { concurrency: 1 })

}
*/ 
//# sourceMappingURL=lib.js.map