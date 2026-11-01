import * as fs from 'fs'
import { toFile } from "openai"
import { sync as exists } from '@polymech/fs/exists'
import { sync as write } from '@polymech/fs/write'
import { IKBotTask } from '../ai-tools/index.js'
import { createClient } from '../client.js'

const createBuffer = (path: string): Buffer | null => {
    try {
        const buffer = fs.readFileSync(path)
        return buffer;
    } catch (error) {
        console.error('Error creating buffer:', error);
        return null;
    }
}

export const transcribe = async (options: IKBotTask): Promise<string> => {
    const client = createClient(options)
    if (!client) {
        options.logger.error('Failed to create client')
        return ''
    }

    if (!options.include || options.include.length === 0) {
        options.logger.error('No source file provided via --include')
        return '';
    }

    const sourceFile = options.include[0];

    if (!exists(sourceFile)) {
        options.logger.error('Source file does not exist', sourceFile)
        return '';
    }

    const file = await toFile(createBuffer(sourceFile), 'audio.mp3', { type: 'audio/mpeg' });
    if (!file) {
        options.logger.error('Error converting source to file')
        return '';
    }

    const completion: any = await client.audio.transcriptions.create({
        model: 'whisper-1',
        file: file,
        response_format: (options as any).response_format || "verbose_json",
    })

    if (!completion) {
        options.logger.error('OpenAI response is empty')
        return '';
    }

    const text_content = completion.text || ''
    return text_content
}
