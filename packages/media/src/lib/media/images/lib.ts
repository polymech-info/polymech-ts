import * as path from 'path'
import * as fs from 'fs'
import sharp from 'sharp'
import { sync as read } from "@polymech/fs/read"
import { logger } from '../../../index.js'

export const fileAsBuffer = (path: string) => read(path, 'buffer') as Buffer || Buffer.from("-")

export const base64ToBuffer = async (b64string: string) => Buffer.from(b64string, 'base64')

export const imageToBase64 = async (imagePath: string): Promise<string> => {
    try {
        const imageBuffer = await fs.promises.readFile(imagePath);
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = path.extname(imagePath).slice(1);
        const dataUri = `data:image/${mimeType};base64,${imageBase64}`;
        return dataUri;
    } catch (error) {
        throw new Error(`Failed to convert image to base64: ${error}`);
    }
}

export const meta = (file, image: sharp.Sharp): Promise<sharp.Metadata | null> => {
    return new Promise((resolve) => {
        image.metadata().then((meta) => {
            resolve(meta)
        }).catch((e) => {
            logger.error(`Error creating meta data ${file}`)
            resolve(null)
        })
    })
}
