
import { parse, join } from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'
import { sync as write } from '@polymech/fs/write'
import * as fs from 'fs'
import { lookup } from 'mime-types'
import { IKBotTask } from '../../types.js'
import { toolLogger } from '../../index.js'

export const mime = (file: string = '') => parse(file).ext ? lookup(file) : null

//const screenshot = require('screenshot-desktop')

export const fileToBase64 = (filePath: string): string | null => {
    try {
        const fileBuffer = fs.readFileSync(filePath)
        const mimeType = lookup(filePath)
        if (!mimeType) {
            throw new Error('Unable to determine MIME type.')
        }
        const base64Data = fileBuffer.toString('base64')
        return `data:${mimeType};base64,${base64Data}`
    } catch (error) {
        console.error('fileToBase64 : Error reading file:', error)
        return null
    }
}
export const tools = (target: string, options: IKBotTask): Array<any> => {
    const logger = toolLogger('user', options)
    return [
        {
            type: 'function',
            function: {
                name: 'capture_screen',
                description: 'Capture a screenshot and store it as file (jpg). Returns the path to the file',
                parameters: {
                    type: 'object',
                    properties: {
                        file: { type: 'string' }
                    },
                    required: ['file']
                },
                function: async (params: any) => {
                    try {
                        const outputPath = join(target, params.file)
                        const takeScreenshot = async () : Promise<any> => {
                            /*
                            return new Promise((resolve, reject) => {
                                screenshot({ format: 'jpg' }).then((img) => {
                                    write(outputPath, img)
                                    resolve({ success: true, path: outputPath})
                                }).catch(reject)
                            })
                            */
                        }
                        const { path } = await takeScreenshot()
                        return {
                            "role": "user",
                            "content":
                              [
                                /*
                                {
                                  type: "image_url",
                                  image_url: {
                                    url: fileToBase64( path),
                                  }
                                }
                                */
                              ]
                          }                        
                    } catch (error: any) {
                        logger.error('Error capturing screenshot:', error);
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>
    ];
};