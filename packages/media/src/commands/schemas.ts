import * as CLI from 'yargs'
import { cli } from '../cli.js'
import { schemas as resizeSchemas, types as resizeTypes } from '../lib/media/images/resize.js'
import { schemas as pdf2jpgSchemas, types as pdf2jpgTypes } from '../lib/pdf/convert.js'
import { schemas as watermarkSchemas, types as watermarkTypes } from '../lib/media/images/watermark.js'
import { schemas as backgroundRemoveSchemas, types as backgroundRemoveTypes } from '../lib/media/images/background-remove.js'
import { schemas as backgroundRemoveBriaSchemas, types as backgroundRemoveBriaTypes } from '../lib/media/images/background-remove-bria.js'
import { schemas as cropForegroundSchemas, types as cropForegroundTypes } from '../lib/media/images/crop-foreground.js'

export const command = 'schemas'
export const desc = 'Generate schema files (schemas.json and schema_ui.json)'
export const builder = (yargs: CLI.Argv) => {
    return yargs.option('types', {
        describe: 'Also generate TypeScript types',
        type: 'boolean',
        default: false
    })
}

export async function handler(argv: CLI.Arguments) {
    console.log('Generating schemas...')
    
    // Generate resize schemas
    resizeSchemas()
    console.log('✓ Generated resize schemas')
    
    // Generate pdf2jpg schemas
    pdf2jpgSchemas()
    console.log('✓ Generated pdf2jpg schemas')
    
    // Generate watermark schemas
    watermarkSchemas()
    console.log('✓ Generated watermark schemas')
    
    // Generate background-remove schemas
    backgroundRemoveSchemas()
    console.log('✓ Generated background-remove schemas')
    
    // Generate background-remove-bria schemas
    backgroundRemoveBriaSchemas()
    console.log('✓ Generated background-remove-bria schemas')
    
    // Generate crop-foreground schemas
    cropForegroundSchemas()
    console.log('✓ Generated crop-foreground schemas')
    
    if (argv.types) {
        resizeTypes()
        pdf2jpgTypes()
        watermarkTypes()
        backgroundRemoveTypes()
        backgroundRemoveBriaTypes()
        cropForegroundTypes()
        console.log('✓ Generated TypeScript types')
    }
    
    console.log('Schema generation complete!')
}

cli.command(command, desc, builder, handler)
