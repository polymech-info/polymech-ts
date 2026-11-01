"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resize = exports.getResizePatterns = exports.format = exports.updateImages = exports.getFormats = void 0;
var path = require('path');
const exists = require('@plastichub/fs/exists').sync;
const sharp = require('sharp');
const glob = require('glob');
const fs = require('fs');
const JSDOM = require('jsdom').JSDOM;
const URI = require("uri-js");
const getFormats = (product, folder) => {
    return [{
            src: `${product}/${folder}/*.jpg`,
            dist: `${product}/${folder}/webp`,
            format: 'webp',
        }];
};
exports.getFormats = getFormats;
const updateImages = (root, product_root, content) => __awaiter(void 0, void 0, void 0, function* () {
    // Feed the content into JSDOM
    const dom = new JSDOM(content);
    const document = dom.window.document;
    // Find the image elements via `querySelectorAll`, replace this selector with your own custom one
    const imageElems = document.querySelectorAll('img');
    // If there are no matching elements, just return the original content :)
    if (imageElems.length === 0) {
        console.log('no images');
        return content;
    }
    for (const imgElem of imageElems) {
        // Get the `src` of the image element
        const imgSrc = imgElem.getAttribute('src');
        // Only add this transform for internal images
        if (imgSrc.startsWith('https') || imgSrc.startsWith('http')) {
            let srcSet = [];
            // Replace all of the image sources with a new one that matches the results of the Sharp build
            if (imgSrc.indexOf('.png') !== -1) {
                continue;
            }
            const parsed = URI.parse(decodeURIComponent(imgSrc));
            const pParsed = path.parse(parsed.path);
            const imageName = (url) => {
                return decodeURIComponent(pParsed.base);
            };
            // const parts = url.parse(imgSrc);
            // Get the metadata for the file and add it as the `${width}w` needed in defining a `srcset` in HTML for `<img>`
            const name = imageName(imgSrc);
            const _path = decodeURIComponent(parsed.path).replace('//', '');
            const imageSrcPath = `${root}/${_path}`;
            if (!exists(imageSrcPath)) {
                console.log('image doesnt exists : ' + imageSrcPath + ' \n\t' + imgSrc);
                return;
            }
            const imageSrcPathParts = path.parse(imageSrcPath);
            const imgSrc80 = imgSrc.replace(name, '80/' + name);
            const imgSrc60 = imgSrc.replace(name, '60/' + name);
            const imgSrc40 = imgSrc.replace(name, '40/' + name);
            const imgSrc20 = imgSrc.replace(name, '20/' + name);
            const _set = (res) => {
                return path.resolve(imageSrcPathParts.dir + '/' + res + '/' + name);
            };
            if (!exists(_set(80))) {
                console.error('doesnt exists ', _set(80), imgSrc);
                continue;
            }
            if (!exists(_set(60))) {
                console.error('doesnt exists ', _set(60), imgSrc);
                continue;
            }
            if (!exists(_set(40))) {
                console.error('doesnt exists ', _set(40), imgSrc);
                continue;
            }
            if (!exists(_set(20))) {
                console.error('doesnt exists ', _set(20), imgSrc);
                continue;
            }
            const img80 = yield sharp(_set(80));
            const md80 = yield img80.metadata();
            srcSet.push(`${imgSrc80.replace(/\s/g, '%20')} ${md80.width}w`);
            // Repeat
            const img60 = yield sharp(_set(60));
            const md60 = yield img60.metadata();
            srcSet.push(`${imgSrc60.replace(/\s/g, '%20')} ${md60.width}w`);
            // Repeat
            const img40 = yield sharp(_set(40));
            const md40 = yield img40.metadata();
            srcSet.push(`${imgSrc40.replace(/\s/g, '%20')} ${md40.width}w`);
            // Repeat
            const img20 = yield sharp(_set(20));
            const md20 = yield img20.metadata();
            srcSet.push(`${imgSrc20.replace(/\s/g, '%20')} ${md20.width}w`);
            // Join the `srcset` into a string. that can be added to the `<img>` tag
            srcSet = srcSet.join(', ');
            // Set the `srcset` attribute
            imgElem.setAttribute('srcset', srcSet);
            // Find the new `src` for the WebP image
            let webpSrc = imgSrc.replace(name, 'webp/' + encodeURIComponent(name)).replace('.png', '.webp').replace('.jpg', '.webp');
            /*    const webpSrc = imgSrc
                .replace('/images/', '/images/webp/')
                .replace('.png', '.webp');
            */
            // Create a separate `source` element for the WebP with feature detection via `type`
            const webpElement = document.createElement('source');
            webpElement.setAttribute('srcset', webpSrc);
            webpElement.setAttribute('type', 'image/webp');
            // Wrap the `<img>` and the `<source>` into one `<picture>` tag in order for it to work
            const pictureElement = document.createElement('picture');
            pictureElement.appendChild(webpElement);
            pictureElement.appendChild(imgElem.cloneNode());
            // Replace the `<img>` with the `<picture>`
            imgElem.replaceWith(pictureElement);
        }
    }
    return document.documentElement.outerHTML;
});
exports.updateImages = updateImages;
const format = (formats) => {
    return formats.forEach((format) => {
        // Create the `dist` folder if it doesn't exist already
        if (!fs.existsSync(format.dist)) {
            fs.mkdirSync(format.dist, {
                recursive: true
            }, (err) => {
                if (err)
                    throw err;
            });
        }
        // Find all files matching the glob patterns specified in `src`
        let files = glob.sync(format.src);
        files.forEach((file) => {
            let filename = path.basename(file);
            if (exists(path.resolve(`${format.dist}/${filename.replace('jpg', format.format)}`))) {
                return;
            }
            const image = sharp(file);
            // Convert to WebP via Sharp's inferencing automatically of extensions
            image
                .toFile(`${format.dist}/${filename.replace('jpg', format.format)}`)
                .catch((err) => {
                console.log(err);
            });
        });
    });
};
exports.format = format;
const getResizePatterns = (product, folder) => {
    return [{
            src: `${product}/${folder}/*.jpg`,
            dist: `${product}/${folder}/80`,
            percent: 80,
        },
        {
            src: `${product}/${folder}/*.jpg`,
            dist: `${product}/${folder}/60`,
            percent: 60,
        },
        {
            src: `${product}/${folder}/*.jpg`,
            dist: `${product}/${folder}/40`,
            percent: 40,
        },
        {
            src: `${product}/${folder}/*.jpg`,
            dist: `${product}/${folder}/20`,
            percent: 20,
        },
    ];
};
exports.getResizePatterns = getResizePatterns;
const resize = (patterns) => {
    return patterns.forEach((resize) => {
        // Create the `dist` folder if it doesn't exist already
        if (!fs.existsSync(resize.dist)) {
            fs.mkdirSync(resize.dist, {
                recursive: true
            }, (err) => {
                if (err)
                    throw err;
            });
        }
        // Get all of the files that match the glob pattern in `src`
        let files = glob.sync(resize.src);
        files.forEach((file) => {
            // Get the filename, will be used later
            let filename = path.basename(file);
            // Construct the Sharp object
            const image = sharp(file);
            if (exists(`${resize.dist}/${filename}`)) {
                return;
            }
            // Retrieve the metadata via Sharp
            image
                .metadata()
                .then((metadata) => {
                // Resize the image to a width specified by the `percent` value and output as PNG
                return image
                    .resize(Math.round(metadata.width * (resize.percent / 100)))
                    .png()
                    .toFile(`${resize.dist}/${filename}`)
                    .catch((err) => {
                    console.log(err);
                });
            })
                .catch((err) => {
                console.log(err);
            });
        });
    });
};
exports.resize = resize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9pbWFnZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUNyRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3JDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUV2QixNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtJQUMxQyxPQUFPLENBQUM7WUFDSixHQUFHLEVBQUUsR0FBRyxPQUFPLElBQUksTUFBTSxRQUFRO1lBQ2pDLElBQUksRUFBRSxHQUFHLE9BQU8sSUFBSSxNQUFNLE9BQU87WUFDakMsTUFBTSxFQUFFLE1BQU07U0FDakIsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBTlksUUFBQSxVQUFVLGNBTXRCO0FBRU0sTUFBTSxZQUFZLEdBQUcsQ0FBTyxJQUFJLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxFQUFFO0lBQzlELDhCQUE4QjtJQUM5QixNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUVyQyxpR0FBaUc7SUFDakcsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXBELHlFQUF5RTtJQUV6RSxJQUFJLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDekIsT0FBTyxPQUFPLENBQUM7S0FDbEI7SUFFRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFVBQVUsRUFBRTtRQUM5QixxQ0FBcUM7UUFDckMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUzQyw4Q0FBOEM7UUFDOUMsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDekQsSUFBSSxNQUFNLEdBQVEsRUFBRSxDQUFDO1lBRXJCLDhGQUE4RjtZQUM5RixJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQy9CLFNBQVM7YUFDWjtZQUNELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNyRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QyxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUN0QixPQUFPLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QyxDQUFDLENBQUE7WUFDRCxtQ0FBbUM7WUFDbkMsZ0hBQWdIO1lBQ2hILE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixNQUFNLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNoRSxNQUFNLFlBQVksR0FBRyxHQUFHLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixHQUFHLFlBQVksR0FBRyxPQUFPLEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQ3hFLE9BQU87YUFDVjtZQUNELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVuRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDcEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ3BELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNwRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFFcEQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDakIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUN4RSxDQUFDLENBQUE7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDbEQsU0FBUzthQUNaO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ2xELFNBQVM7YUFDWjtZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNsRCxTQUFTO2FBQ1o7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDbEQsU0FBUzthQUNaO1lBRUQsTUFBTSxLQUFLLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBRWhFLFNBQVM7WUFDVCxNQUFNLEtBQUssR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLElBQUksR0FBRyxNQUFNLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNwQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7WUFFaEUsU0FBUztZQUNULE1BQU0sS0FBSyxHQUFHLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sSUFBSSxHQUFHLE1BQU0sS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUVoRSxTQUFTO1lBQ1QsTUFBTSxLQUFLLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBRWhFLHdFQUF3RTtZQUN4RSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQiw2QkFBNkI7WUFDN0IsT0FBTyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdkMsd0NBQXdDO1lBRXhDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUV6SDs7O2NBR0U7WUFFRixvRkFBb0Y7WUFFcEYsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyRCxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM1QyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUUvQyx1RkFBdUY7WUFFdkYsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN6RCxjQUFjLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3hDLGNBQWMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFFaEQsMkNBQTJDO1lBRTNDLE9BQU8sQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDdkM7S0FDSjtJQUNELE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUM7QUFDOUMsQ0FBQyxDQUFBLENBQUE7QUF4SFksUUFBQSxZQUFZLGdCQXdIeEI7QUFFTSxNQUFNLE1BQU0sR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFO0lBQzlCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQzlCLHVEQUF1RDtRQUV2RCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0IsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO2dCQUN0QixTQUFTLEVBQUUsSUFBSTthQUNsQixFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ1AsSUFBSSxHQUFHO29CQUFFLE1BQU0sR0FBRyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxDQUFDO1NBQ047UUFFRCwrREFBK0Q7UUFDL0QsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ25CLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUNsRixPQUFPO2FBQ1Y7WUFFRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFMUIsc0VBQXNFO1lBQ3RFLEtBQUs7aUJBQ0EsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztpQkFDbEUsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNyQixDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUEvQlksUUFBQSxNQUFNLFVBK0JsQjtBQUVNLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7SUFDakQsT0FBTyxDQUFDO1lBQ0osR0FBRyxFQUFFLEdBQUcsT0FBTyxJQUFJLE1BQU0sUUFBUTtZQUNqQyxJQUFJLEVBQUUsR0FBRyxPQUFPLElBQUksTUFBTSxLQUFLO1lBQy9CLE9BQU8sRUFBRSxFQUFFO1NBQ2Q7UUFDRDtZQUNJLEdBQUcsRUFBRSxHQUFHLE9BQU8sSUFBSSxNQUFNLFFBQVE7WUFDakMsSUFBSSxFQUFFLEdBQUcsT0FBTyxJQUFJLE1BQU0sS0FBSztZQUMvQixPQUFPLEVBQUUsRUFBRTtTQUNkO1FBQ0Q7WUFDSSxHQUFHLEVBQUUsR0FBRyxPQUFPLElBQUksTUFBTSxRQUFRO1lBQ2pDLElBQUksRUFBRSxHQUFHLE9BQU8sSUFBSSxNQUFNLEtBQUs7WUFDL0IsT0FBTyxFQUFFLEVBQUU7U0FDZDtRQUNEO1lBQ0ksR0FBRyxFQUFFLEdBQUcsT0FBTyxJQUFJLE1BQU0sUUFBUTtZQUNqQyxJQUFJLEVBQUUsR0FBRyxPQUFPLElBQUksTUFBTSxLQUFLO1lBQy9CLE9BQU8sRUFBRSxFQUFFO1NBQ2Q7S0FDQSxDQUFDO0FBQ04sQ0FBQyxDQUFBO0FBdEJZLFFBQUEsaUJBQWlCLHFCQXNCN0I7QUFFTSxNQUFNLE1BQU0sR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFO0lBQy9CLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQy9CLHVEQUF1RDtRQUV2RCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0IsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO2dCQUN0QixTQUFTLEVBQUUsSUFBSTthQUNsQixFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ1AsSUFBSSxHQUFHO29CQUFFLE1BQU0sR0FBRyxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxDQUFDO1NBQ047UUFFRCw0REFBNEQ7UUFFNUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBRW5CLHVDQUF1QztZQUN2QyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRW5DLDZCQUE2QjtZQUM3QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFMUIsSUFBSSxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxJQUFJLFFBQVEsRUFBRSxDQUFDLEVBQUU7Z0JBQ3RDLE9BQU87YUFDVjtZQUVELGtDQUFrQztZQUNsQyxLQUFLO2lCQUNBLFFBQVEsRUFBRTtpQkFDVixJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDZixpRkFBaUY7Z0JBQ2pGLE9BQU8sS0FBSztxQkFDUCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO3FCQUMzRCxHQUFHLEVBQUU7cUJBQ0wsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksSUFBSSxRQUFRLEVBQUUsQ0FBQztxQkFDcEMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7b0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckIsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUM7aUJBQ0QsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNyQixDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUE7QUE5Q1ksUUFBQSxNQUFNLFVBOENsQiJ9