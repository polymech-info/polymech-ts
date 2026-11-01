import fs from 'fs'
import { inspect as utilInspect } from 'util'
import { resolve, dirname } from 'path'
const cwd = process.cwd()
var TurndownService = require('turndown')
import { Discourser } from '../index'


import * as path from 'path'
const fg = require('fast-glob')
import slugify from "slugify"

var sanitize = require("sanitize-filename")

import { sync as read } from '@polymech/fs/read'
import { sync as write } from '@polymech/fs/write'

//import { replaceAll } from '../../lib';


var mom = require('moment')

export const uploadFile = async (discourse, forum, name, filePath) => {
	return await discourse.upload(1, filePath);
}

export const findReplyPage = (b, pages) => {
	return pages.find((p) => {
		return p.replies.find((r) => {
			return r.replyBody == b;
		})
	})
}

export const findReplyUpload = (u, page) => {
	const f_pics = page.f_pics || [];
	return f_pics.find((p) => {
		return p.url === u;
	})
}

export const getPages = (topics, topic) => {
	return topics.filter((t) => {
		return t.title == topic.title;
	});
};

export const getReplies = (topics, topic) => {
	if (topic.nextPages) {
		const all = topics.filter((t) => {
			return t.title == topic.title;
		});
		let replies: [] = all.map((t) => t.replies);
		replies = [].concat.apply([], replies);
		replies = replies.sort((a: any, b: any) => {
			const d1 = mom(a.replyDate, 'DD/MM/YYYY AT HH:mm').toDate()
			const d2 = mom(b.replyDate, 'DD/MM/YYYY AT HH:mm').toDate()
			return new Date(d1).getTime() > new Date(d2).getTime() ? 1 : -1;
		});

		return replies;
		/*
		const findReply = (b, pages) => {
			return pages.find((p) => {
				return p.replies.find((r) => {
					return r.replyBody == b;
				})
			})
		}
		const p = findReply('\n\n\n<p>sounds great, let me get Old Tony´s Schaeubling 13 and a surface grinder first, after that I can do the parts for the espresso machine in the best <a href=\"https://www.youtube.com/watch?v=hpenv1ZqGx4\" rel=\"nofollow\" target=\"_blank\">maker porn fashion possible,</a>&nbsp;no seriously, every time I thought I know something, there’s just another video around the next corner making me cry like a baby, incl. the coffee machine <img draggable=\"false\" class=\"emoji\" alt=\"🙁\" src=\"https://s.w.org/images/core/emoji/11/svg/1f641.svg\"></p>\n', all);
		debugger;
		*/
	}
	return [];
}

export const findFile = (folder, filename) => {
	const files = fg.sync('**/**/*' + filename + '*', { dot: true, cwd: folder, absolute: true });
	if (files.length == 0) {
		return false;

	}
	return files[0];
}

export const topicFolder = (forum, folder, title) => {
	const _title = sanitize(slugify(title));
	const tf = path.resolve(forum + '/' + folder + '/' + _title);
	return tf;
}

export const getFUser = (users, user_name) => {
	return users.find((u) => {
		return u.name == user_name
	})
}

export const dOptions = {
	host: 'https://forum.osr-plastic.org',
	key: 'f624b8385fb2219cb49de63d1e22883afdf7b7367a0bebf822523f49f2678031',
	username: 'admin',
	rateLimitConcurrency: 1
}

export const getOAvatar = (index, user) => {
	const topics = getTopics(index);
	let topic: any = topics.find((t: any) => {
		return t.authorName == user;
	});
	if (topic) {
		return topic.authorImage;
	}
	for (let i = 0; i < topics.length; i++) {
		const t: any = topics[i]
		if (t.replies) {
			const r = (t.replies as any[]).find((r) => {
				return r.user == user;
			})
			if (r) {
				return r.avatar;
			}
		}
	}
	return null;
}

export const getTopics = (index: any) => {
	let topics = [];
	for (let t in index) {
		topics.push(index[t]);
	}
	return topics;
}

export const convert = (input: string) => {
	var turndownService = new TurndownService()
	return turndownService.turndown(input);
}

export const getDiscourse = () => {
	return new Discourser(dOptions);
}

export function inspect(arg: any) {
	return utilInspect(arg, {
		depth: 5,
		colors: true,
	})
}

export function log(...args: any[]) {
	console.log(...args.map((arg) => inspect(arg)))
}

export async function mkdirp(path: string) {
	try {
		await fs.promises.mkdir(path)
	} catch (err) {
		// don't care if it already exists
	}
}

export async function readJSON<T extends object>(path: string): Promise<T> {
	const text = await fs.promises.readFile(path, 'utf8')
	return JSON.parse(text)
}

export function writeJSON(path: string, data: object) {
	return fs.promises.writeFile(path, JSON.stringify(data))
}

export function exists(path: string): Promise<boolean> {
	return new Promise(function (resolve) {
		fs.exists(path, resolve)
	})
}

export function escape(path: string): string {
	return path.replace(/[^\w]/g, '-').replace(/-+/, '-')
}
