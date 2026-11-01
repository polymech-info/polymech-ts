import { Promise as BPromise } from 'bluebird';
import { forward_slash } from '@polymech/commons';
import { resolveConfig } from '@polymech/core';
import { substitute } from '@polymech/core/strings';
import { logger } from '../../index';
import { HT_CATS } from '../discourse/constants';
import { sanitize } from './lib';
import * as path from 'path';
import { sync as read } from '@polymech/fs/read';
import { sync as exists } from '@polymech/fs/exists';
import { sync as write } from '@polymech/fs/write';
import { resolve } from '@polymech/commons';
import * as cheerio from 'cheerio';
import { get_user_name } from './users';
var escapeHtml = require('escape-html');
import { sync as mkdir } from '@polymech/fs/dir';
import { files } from '@polymech/commons';
const FUCKING_TOKEN = 'j7oYrkQe5nbnikCNHcfoP2DGtXKV4iHHzDFip8gGatS145g3B65UU6mI09KeFday9mY5HNQnU2jXUTe7LLkP-w';
import { kb_howto_file, kb_howto_folder, getHowtos, getHowtosPath, getHowtoUser, md_edit_wrap, toHTML, toMDImage, createTextLinks_, removeEmojis, DEFAULT_HT_CATEGORY, read_tags } from './commons';
export const mergeLatest = (discorse, options, oa_howtos) => {
    const howtos = getHowtos();
    oa_howtos.forEach((h) => {
        const howto = howtos.find((tu) => {
            return tu._id === h._id;
        });
        if (!howto) {
            howtos.push(h);
        }
    });
    write(getHowtosPath(), howtos);
    return howtos;
};
const updateHowtoFile = (howto) => {
    const howtos = getHowtos();
    const index = howtos.findIndex((u) => u._id == howto._id);
    howtos[index] = howto;
    write(getHowtosPath(), howtos);
};
const uploadImage = async (discourse, user, image, localPath) => {
    if (image.data) {
        return image;
    }
    logger.debug('uploading image:', image.name);
    const upped = await discourse.uploadFile(user.f_id, localPath);
    const data = upped.data;
    if (data && data.id) {
        image.data = data;
    }
    else {
        logger.error('error uploading image');
    }
    return image;
};
export const read_fragments = (src, config, prefix = '', context = '') => {
    if (!exists(src)) {
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
};
export async function howto_content(howto, folder, fragments, templates) {
    //const tags = data.v3_tags;
    const howtoTags = [];
    /*
    for (const ht in howto.tags) {
        const gt = tags.find((t) => t._id === ht);
        if (gt) {
            howtoTags.push(gt.label);
            // logger.debug('resolved ' + ht + ' to ' + gt.label);
        } else {
            // logger.error('Cant resolve tag : ' + ht);
        }
    }
*/
    howto.slug = howto.slug.trim();
    let s = '';
    let step_template = "" + templates.step;
    let invalid_step_images = false;
    const step_image = (i) => {
        if (!i.data || !i.data.short_url) {
            logger.error('invalid image : ' + i.downloadUrl + ' : ' + howto.slug);
            invalid_step_images = true;
            return '\n';
        }
        return `\n${toMDImage(i)}`;
    };
    const step_file = (i) => {
        const image = `/howtos/${howto.slug}/${encodeURIComponent(sanitize(i.name))}`;
        return `<div class="col-sm">
                <a href="${image}">
                    <p>${i.name}"<p/>
                </a>
            </div>`;
    };
    const step_files = (s) => {
        const files = s.files.map(step_file).join('\n');
        return `<div class="row">
                ${files}
            </div>
        `;
    };
    const step_images = (s) => {
        const images = s.images.map(step_image).join('\n');
        return `${images}`;
    };
    const step_images_gallery = (s) => {
        const images = s.images.map(step_image).join('');
        return `<div data-theme-tiles="1">\n${images}</div>`;
    };
    const step = (s, i) => {
        const t = substitute(step_template, {
            title: s.title,
            text: createTextLinks_(escapeHtml(s.text.trim()).replace(/(?:\r\n|\r|\n)/g, '\n\n')),
            step_number: i + 1,
            images: s.images.length > 1 ? step_images_gallery(s) : step_images(s)
        });
        return t;
    };
    const steps = howto.steps.map((s, i) => step(s, i)).join('\n\n');
    const attachments = howto.files.map((f) => {
        return `[${sanitize(f.name)}](${f.downloadUrl})`;
    });
    howto.description = removeEmojis(howto.description);
    howto.description = createTextLinks_(howto.description);
    let authorName = (howto.user && howto.user.data && howto.user.data && howto.user.data.title) ? howto.user.data.title : (howto.user ? howto.user._id : 'OSR-Plastic');
    if (authorName === 'Precious Plastic Headquarters') {
        authorName = 'Precious Plastic Nantes';
    }
    let _3dFiles = [...files(path.resolve(`${folder}`), '**/**/*.step'), ...files(path.resolve(`${folder}`), '**/**/*.STEP'), ...files(path.resolve(`${folder}`), '**/**/*.stp')];
    _3dFiles = _3dFiles.map((f) => {
        return forward_slash(`${howto.slug}/${path.relative(path.resolve(folder), f)}`);
    });
    let previews = '';
    if (_3dFiles.length) {
        previews += '<div class="container">';
        previews += '<div class="row"><div class="col-12"><ul class="list-group">';
        _3dFiles = _3dFiles.map((f) => {
            return `
            <li class="list-group-item">
                <span>3D Step File: ${f.replace(howto.slug, '')} - 
                <a href="" class="iframe-lightbox-link" data-src="/howtos/${encodeURIComponent(f).replace('.STEP', '.html').
                replace('.step', '.html').replace('.stp', '.html')}">
                Preview</a>
                </span>
            </li>`;
        });
        previews += _3dFiles.join('');
        previews += '</ul></div></div></div>';
    }
    if (invalid_step_images) {
        return false;
    }
    let index = substitute(templates.howto, {
        ...fragments,
        image: `/howtos/${howto.slug}/${encodeURIComponent(sanitize(howto.cover_image.name))}`,
        title: howto.title.trim(),
        description: escapeHtml(howto.description.trim()) || "",
        enabled: howto.moderation == "accepted" ? true : false,
        steps: steps,
        keywords: ['Precious plastic', 'Preciousplastic', 'plastichub', 'osr', ...howtoTags].join(','),
        user: howto._createdBy,
        files: `${attachments.join('\n')}`,
        authorName: authorName,
        authorUrl: `https://osr-plastic.org/users/${howto.user ? howto.user._id : 'https://osr-plastic.org/users/plastichub'}.html`,
        // short: escapeHtml(howto.description.trim()).substring(0, 100) + '....',
        slug: howto.slug,
        previews3D: previews
    });
    const $ = cheerio.load(index, {
        xmlMode: true
    });
    /*
    $('a').each(function () {
        const url = $(this).attr("href");
        logger.debug('url : ' + url);
        if(url.indexOf('dropbox')){

        }
    });*/
    //write(index_md, pretty(index, { ocd: true }));
    return removeEmojis(index);
}
export const createHowtoTopic = async (discourse, howto, create = true) => {
    if (!howto.category || !howto.category.label) {
        howto.category = DEFAULT_HT_CATEGORY;
        logger.error(`create howto : invalid category: ${howto.category} : ${howto.slug}`);
    }
    const user = getHowtoUser(howto);
    if (!user) {
        logger.error(`create howto : invalid user : ${howto._createdBy} :: ${howto.title}`);
    }
    const howto_folder = kb_howto_folder(howto);
    const howto_cover_image = kb_howto_file(howto, howto.cover_image.name);
    if (!exists(howto_folder)) {
        logger.error('howto folder doesnt exists', howto.title);
    }
    if (!exists(howto_cover_image)) {
        logger.error('howto cover image doesnt exists', howto.title);
    }
    if (!user || !user.f_id) {
        logger.error(`create howto : invalid user : ${howto._createdBy} :: ${howto.title}`);
        return false;
    }
    howto.cover_image = await uploadImage(discourse, user, howto.cover_image, howto_cover_image);
    updateHowtoFile(howto);
    let invalid_images = false;
    for (const step of howto.steps) {
        let i = 0;
        for await (const image of step.images) {
            const image_name = sanitize(image.name);
            const imagePath = path.resolve(path.join(howto_folder, sanitize(image_name)));
            if (!exists(imagePath)) {
                logger.error('step image doesnt exists : ' + image.name + ' in ' + howto.slug);
                invalid_images = true;
                continue;
            }
            step.images[i] = await uploadImage(discourse, user, step.images[i], imagePath);
            updateHowtoFile(howto);
            i++;
        }
    }
    if (invalid_images) {
        logger.error('invalid images : ' + howto.slug);
        return false;
    }
    const cat = HT_CATS[howto.category.label];
    if (!cat) {
        logger.error('invalid kat');
        return false;
    }
    const templatesRoot = path.resolve(resolve("${OSR_ROOT}/osr-templates/discourse"));
    const cPath = path.resolve(`${templatesRoot}/base.json`);
    logger.debug(`read config at ${cPath}`);
    const config = read(cPath, 'json');
    const templates = path.resolve(`${templatesRoot}/howto`);
    if (!exists(templates)) {
        logger.error(`\t Cant find templates at ${templates}, path doesn't exists`);
        return;
    }
    let fragments = { ...config.variables };
    read_fragments(templates, fragments, "product_rel_path_name", "machine");
    let template = read(path.resolve(`${templates}/howto.md`), 'string');
    let step = read(path.resolve(`${templates}/step.md`), 'string');
    resolveConfig(fragments);
    const content = await howto_content(howto, howto_folder, fragments, {
        howto: template,
        step: '' + step
    });
    if (!content) {
        logger.error('invalid content : ' + howto.slug);
        return;
    }
    let data;
    if (create) {
        data = await discourse.createPost(sanitize(howto.title), content, cat);
        if (data) {
            logger.debug('created topic : ' + howto.title + ' :  ' + data.id);
            if (data && data.id) {
                howto.post_id = data.id;
                howto.topic_id = data.topic_id;
                updateHowtoFile(howto);
                try {
                    logger.debug('change user to ', user._id);
                    await discourse.changeOwner(howto.post_id, howto.topic_id, get_user_name(user));
                }
                catch (e) {
                    logger.debug('changing owner ' + howto.title + ' failed!');
                    howto.oF = true;
                    updateHowtoFile(howto);
                }
            }
            else {
                logger.debug('creating ' + howto.title + ' failed!', data.errors);
                howto.post_id = 'failed';
                if (data.errors) {
                    if (data.errors[0] && data.errors[0] === 'Title has already been used') {
                        logger.error('title already used : ' + howto.slug);
                        howto.post_id = 'already';
                    }
                }
                updateHowtoFile(howto);
            }
        }
    }
    else {
        data = await discourse.updatePost(howto.post_id, content);
        howto._updatedContent1 = true;
        updateHowtoFile(howto);
    }
};
export const importHowto = async (discorse, howto) => {
    //const howtos = getHowtos()
    //const index = howtos.findIndex((u) => u._id == howto._id)
    const ret = await createHowtoTopic(discorse, howto);
    return ret;
};
export const importHowtos = async (discorse, options, howtos) => {
    logger.debug('read howtos from ', path.resolve(getHowtosPath()));
    howtos = mergeLatest(discorse, options, howtos);
    howtos = howtos.filter((h) => {
        if (h.title === 'Build a Fishing Canoe') {
            //debugger
        }
        if (h.post_id || h.post_id < 0) {
            return false;
        }
        if (h.post_id === 'failed') {
            logger.debug('skip failed : ' + h.slug);
            return false;
        }
        //if (u.alreadyExists || u.invalidData) {
        //    return false;
        //}
        return true;
    });
    return await BPromise.resolve(howtos).map((h) => {
        try {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const d = importHowto(discorse, h);
                    if (d) {
                        d.then(resolve);
                    }
                    else {
                        reject();
                    }
                }, 500);
            });
        }
        catch (e) {
            debugger;
            logger.error('error creating howto ' + h._id, e);
        }
    }, { concurrency: 1 });
};
/////////////////////////////////////////////////////////////////////////
//
//  Update Howtos
//
let _discorseTags;
const getDiscourseTags = async (discourse) => {
    if (!_discorseTags) {
        _discorseTags = await discourse.getTags();
    }
    return _discorseTags;
};
export const updateHowto = async (discourse, howto, options) => {
    const tags = read_tags(options.src);
    let howtoTags = [];
    for (const ht in howto.tags) {
        const t = ht;
        const gt = tags.find((t) => {
            return t._id === ht;
        });
        if (gt) {
            howtoTags.push(gt.label);
        }
        else {
            // logger.error('Cant resolve tag : ' + ht);
        }
    }
    howtoTags.push('oa-import');
    let discorseTags = await getDiscourseTags(discourse);
    const cat = HT_CATS[howto.category.label];
    if (howtoTags && howtoTags.length) {
        try {
            const ret = await discourse.updateTopic(howto.topic_id, cat, sanitize(howto.title), howtoTags);
            logger.debug('Updating howto tags : ' + howto.title);
        }
        catch (error) {
            logger.error('Error updating post' + howto.title, howto.topic_id, cat, howtoTags, error);
            howto['updateFailed1'] = 1;
            updateHowtoFile(howto);
            //debugger            
        }
    }
    howto.updatedTags = true;
    updateHowtoFile(howto);
    const _date = howto._modified || howto._created;
    if (_date) {
        let date = new Date(_date);
        logger.debug('update ts ' + howto.slug + ' : ' + new Date(date).toLocaleDateString());
        let offset = 0;
        const valueOf = date.valueOf() - (offset) * 60000;
        let ts = Math.floor(valueOf / 1000);
        const tUpdate = await discourse.updateTopicTimestamp(howto.topic_id, ts, FUCKING_TOKEN);
        if (tUpdate) {
            howto.updatedTime8 = true;
            updateHowtoFile(howto);
            return true;
        }
    }
    else {
        logger.error('Have no ts : ' + howto.slug);
    }
};
export const updateHowtos = async (discorse, options, howtos) => {
    logger.debug('update howtos from ', path.resolve(getHowtosPath()));
    howtos = mergeLatest(discorse, options, howtos);
    const forceUpdateContent = true;
    const forceUpdateMeta = true;
    const updateContent = true;
    const updateMeta = true;
    howtos = howtos.filter((h) => {
        if (!h.post_id || !h.topic_id) {
            return false;
        }
        if (h.post_id === 'failed') {
            logger.debug('skip failed : ' + h.slug);
            return false;
        }
        if (forceUpdateContent || forceUpdateMeta) {
            return true;
        }
        if (!h._updatedContent1) {
            return true;
        }
        if (h.updatedTags && h.updatedTime8) {
            return false;
        }
        if (!h.updatedTags || !h.updatedTime8) {
            return true;
        }
        return true;
    });
    return await BPromise.resolve(howtos).map((h) => {
        try {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (updateContent) {
                        logger.debug('\t recook howto content', h.title);
                        let d = createHowtoTopic(discorse, h, false);
                        d.then(() => {
                            if (updateMeta) {
                                d = updateHowto(discorse, h, options);
                                if (d) {
                                    d.then(resolve);
                                }
                                else {
                                    reject();
                                }
                            }
                            else {
                                resolve(1);
                            }
                        });
                    }
                }, 500);
            });
        }
        catch (e) {
            debugger;
            logger.error('error creating howto ' + h._id, e);
        }
    }, { concurrency: 1 });
};
//# sourceMappingURL=howtos.js.map