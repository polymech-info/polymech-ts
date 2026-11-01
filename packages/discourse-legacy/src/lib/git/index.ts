
import {logger} from '../../index'

const GIT_CHANGELOG_MESSAGE_PREFIX = ''

import * as path from 'path';

import * as simpleGit from 'simple-git/promise';
import { SimpleGit } from 'simple-git';
import * as moment from 'moment';

export async function git_status(cwd, dir) {

    const git: SimpleGit = simpleGit(cwd);
    let statusSummary:any = null;
    try {
        statusSummary = await git.log(['--stat', dir]);
    }
    catch (e) {
        logger.error('Error Git', e);
    }
    return statusSummary;
}

export async function git_log(cwd, dir) {
    const stats = await git_status(cwd, dir);
    logger.info(`Reading Git log at ${cwd}/${dir}`);
    let changelogs = stats.all.filter((e) => e.message.trim().toLowerCase().startsWith(GIT_CHANGELOG_MESSAGE_PREFIX.toLowerCase()));
    if (!changelogs.length) {
        return { files: [], last:stats.latest }
    }
    let pretty = changelogs.map((e) => {
        return {
            files: e.diff.files.map((f) => { return { path: f.file } }),
            msg: e.message.toLowerCase().replace(GIT_CHANGELOG_MESSAGE_PREFIX.toLowerCase(), '').trim(),
            hash: e.hash,
            date: moment(e.date).format('LLLL')
        }
    });
    
    return { files: pretty, last: stats.latest };
};