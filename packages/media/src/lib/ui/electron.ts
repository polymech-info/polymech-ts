import * as path from 'path'

import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/read'
import { substitute } from '@polymech/commons'

const htmlFilePathIn = path.resolve('./web-ui/_prompt.html')
const htmlFilePathOut = path.resolve('./web-ui/prompt.html')

import { Helper } from './../process/index.js'

// Define the interface for the result
export interface Result {
    editBoxValue: string;
    selectedTemplate: string;
    selectedFiles: string[];
    selectedModel: string;
}

// Legacy function for backward compatibility
export const web_prompt = async (prompt: string, dst:string, variables:any = {}) => {
    
    write(htmlFilePathOut, substitute(false, read(htmlFilePathIn) as string,
    {
        QUERY: prompt,
        DST: dst,
        ...variables
    }))
    const electronPath = path.join(process.cwd(), './node_modules/electron/dist/electron.exe')
    const mainPath = path.join(process.cwd(), 'dist-in/lib/ui/electron/main.js');
    const p = await Helper.runBin(
        process.cwd(),
        electronPath,
        '',
        [`"${mainPath}"`])

    const content = p.messages.find((m) => m.type === 'content')
    return content
}

// New schema-based UI function
export const renderSchemaUI = async (options: {
    schema: any;
    uiSchema?: any;
    formData?: any;
    title?: string;
    width?: number;
    height?: number;
    cliOptions?: any;
}) => {
    // Write config to a temporary file that main process can read
    const configPath = path.resolve('./web-ui/temp-config.json')
    const config = {
        schema: options.schema,
        uiSchema: options.uiSchema || {},
        formData: options.formData || {},
        title: options.title || 'Configuration',
        cliOptions: options.cliOptions || {}
    }
    
    write(configPath, JSON.stringify(config, null, 2))
    
    const electronPath = path.join(process.cwd(), './node_modules/electron/dist/electron.exe')
    const mainPath = path.join(process.cwd(), 'dist-in/lib/ui/electron/main.js');
    
    console.log('renderSchemaUI: Starting Electron...')
    console.log('electronPath:', electronPath)
    console.log('mainPath:', mainPath)
    console.log('configPath:', configPath)
    console.log('config:', config)
    
    const p = await Helper.runBin(
        '',
        electronPath,
        '',
        [`"${mainPath}"`, `--config="${configPath}"`])
    
    console.log('renderSchemaUI: Electron process result:', p)

    const content = p.messages.find((m) => m.type === 'content')
    
    // Cleanup temp file
    try {
        const fs = await import('fs')
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath)
        }
    } catch (e) {
        // Ignore cleanup errors
    }
    
    return content
}
