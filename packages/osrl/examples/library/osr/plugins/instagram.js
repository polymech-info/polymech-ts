const url = require('url');
const path = require('path');
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection, reason: ', reason);
    debugger;
});
const images = (user, password, context) => {
    return new Promise((resolve, reject) => {
        context.ig.feed(user, password).then((f) => {
            f = f.feed.filter((p)=>{
                return p.media_type !==2;
            });
            let ret = f.map((p) => {
                try {
                    const media = p.carousel_media ? p.carousel_media[0] : {
                        image_versions2: p.image_versions2
                    };
                    if (media) {
                        const version = media.image_versions2.candidates[1] ? media.image_versions2.candidates[1] : media.image_versions2.candidates[0];
                        return {
                            image: version.url,
                            url: p.code
                        }
                    }
                } catch (e) {
                    debugger;
                }
            });
            context.BPromise.resolve(ret).map((i) => {
                const parts = url.parse(i.image);
                const fileName = context.fs.path.basename(parts.pathname);
                const cacheDir = context.fs.path.resolve(`${context.CACHE}`);
                const cacheFile = context.fs.path.resolve(`${cacheDir}/${fileName}`);
                if (context.fs.exists(cacheFile)) {
                    return cacheFile;
                } else {
                    return context.download(i.image, cacheDir);
                }
            }, {
                concurrency: 1
            }).then(() => {
                ret = ret.map((i) => {
                    const parts = url.parse(i.image);
                    const fileName = context.fs.path.basename(parts.pathname);
                    return {
                        path:  `${context.CACHE_URL}/${fileName}`,
                        url : i.url
                    }
                });
                resolve(ret);
            });
        });
    });
}
module.exports = {
    instagram: {
        images: images
    }
};