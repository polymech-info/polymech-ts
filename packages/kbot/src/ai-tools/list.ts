import type { Argv } from 'yargs'
import { tools } from '../lib/tools/tools.js'
import { logger } from '../index.js'
import { ListCommandSchema } from '../zod_schemas.js'
import { sync as write } from '@polymech/fs/write'
import { toYargs } from '@polymech/commons/schemas'

export const options = (yargs: Argv) => toYargs(yargs, ListCommandSchema)

interface FSParameters {
    type: string;
    properties: Record<string, any>;
    required: string[];
}
interface FSDefinition {
    name: string;
    description: string;
    category: string;
    parameters: FSParameters;
}
interface FSData {
    fs: FSDefinition[];
}

export const signature = (definition: FSDefinition): string => {
    const { properties } = definition.parameters;
    const requiredKeys = definition.parameters.required || [];
    const params = Object.entries(properties).map(([key, val]) => {
        const isRequired = requiredKeys.includes(key);
        const isOptional = !!val.optional || !isRequired;
        return isOptional ? `?${key}` : key;
    });
    return `(${params.join(", ")})`;
}

export function format(category: string, data: any): string {
    const lines: string[] = [`## ${category}\n`];
    data.forEach(definition => {
        const functionName = definition.name
        const args = `${signature(definition)}`
        const summary = definition.description
        lines.push(`- ${functionName}${args}: ${summary}`)
    })
    return lines.join("\n")
}

export const list = async (argv: any, options?: any) => {
    const getCategorizedTools = (category, options) => {
        const toolsArray = tools[category](process.cwd(), options);
        return toolsArray.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            category,
            parameters: tool.function.parameters
        }));
    }
    const toolsList = {
        email: getCategorizedTools('email', options),
        search: getCategorizedTools('search', options),
        interact: getCategorizedTools('email', options),
        fs: getCategorizedTools('fs', options),
        npm: getCategorizedTools('npm', options),
        git: getCategorizedTools('git', options),
        terminal: getCategorizedTools('terminal', options)
    }
    //write(argv.output + '.json', Object.keys(toolsList).map((k,v)=>format(k,v as any)).join('\n') );

    const shortDescription = Object.keys(toolsList).map((value:string) => {
        return format(value,toolsList[value])
    }).join('\n\n');
    if (argv.output) {
        write(argv.output, JSON.stringify(toolsList, null, 2))
        write(argv.output + '.md', shortDescription)
    }
}