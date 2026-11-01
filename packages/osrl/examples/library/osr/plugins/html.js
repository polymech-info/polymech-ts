const path = require('path');
const proc = require('process');
console.log('cwd ' + proc.cwd())

// const c = require('@plastichub/osrl/library')

const context = {}//  require('@plastichub/osrl/library').getContext();

const link = (name, link, _class) => `<a class="${_class||''}" ref="${link}">${name}</a>`;
const wrap = (content) => `
<div style="padding:16px; text-align: center; ">
    <div class="ty-vendor-plans">
    ${content}
</div>
</div>
`;

const image = (src, link, style) => `<a href="${link||src}"><img style="${style||''}"  src="${src}"></img></a>`;

const item = (content, style = 'border-color: #c5c5c5;width: 300px;display: inline-block', title) =>
    `<div class="ty-grid-list__item" style="float:left;overflow:initial;${style}">
    ${content}<br/>
    <h6>${title||''}</h6>
</div>`;

const styles = {
    thumb: 'border:none; width:200px;max-height:200px'
};

const center_caption = (el = 'h5', text) => `<${el} style="text-align:center">${text}</${el}>`;

const thumbs = (url, folder) => {
    folder = path.resolve(folder);
    images = [];
    /*
    let images = context.fs.images(folder, {
        absolute: false
    });
    */
    images = images.map((i) => item(image(`${url}/${i}`), 'border:none; width:200px;max-height:200px'));
    images = wrap(images.join('\n'));
    return images;
}
module.exports = {
    html: {
        link: link,
        caption: {
            center: center_caption
        },
        container: {
            wrap: wrap,
            item: item
        },
        image: image,
        styles: styles,
        thumbs: thumbs
    }
};