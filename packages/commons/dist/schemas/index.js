import * as path from 'path';
import { z, ZodObject, ZodOptional, ZodDefault } from 'zod';
import { sync as writeFS } from '@polymech/fs/write';
import { zodToTs, printNode, createAuxiliaryTypeStore } from 'zod-to-ts';
import { zodToJsonSchema } from "zod-to-json-schema";
import { logger } from '../logger.js';
export * from './path.js';
export * from './zod_map.js';
export const generate_interfaces = (schemas, dst) => {
    const types = schemas.map(schema => `export interface ${schema.description || 'IOptions'} ${printNode(zodToTs(schema, { auxiliaryTypeStore: createAuxiliaryTypeStore() }).node)}`);
    writeFS(dst, types.join('\n'));
};
export const enumerateHelpStrings = (schema, path = [], logger) => {
    if (schema instanceof ZodObject) {
        for (const key in schema.shape) {
            const nestedSchema = schema.shape[key];
            enumerateHelpStrings(nestedSchema, [...path, key], logger);
        }
    }
    else {
        const description = schema._zod?.def?.description ?? schema._def?.description;
        if (description) {
            logger.debug(`\t ${path.join('.')}: ${description}`);
        }
    }
};
export const yargsDefaults = (yargs) => yargs.parserConfiguration({ "camel-case-expansion": false });
export const getInnerSchema = (schema) => {
    // ZodEffects was removed in Zod v4; just return the schema as-is
    return schema;
};
export const getInnerType = (type) => {
    while (type instanceof ZodOptional) {
        type = type.unwrap();
    }
    while (type instanceof ZodDefault) {
        type = type.removeDefault();
    }
    // Zod v4: typeName is on _zod.def.type (fallback to _def.typeName for compat)
    return type._zod?.def?.type ?? type._def?.typeName;
};
export const getDefaultValue = (schema) => {
    if (schema instanceof ZodDefault) {
        // Zod v4: defaultValue moved to _zod.def.defaultValue
        const defVal = schema._zod?.def?.defaultValue ?? schema._def?.defaultValue;
        return typeof defVal === 'function' ? defVal() : defVal;
    }
    return undefined;
};
export const getFieldDefaultValue = (schema) => {
    if (!schema) {
        return undefined;
    }
    if (schema instanceof ZodDefault) {
        const defVal = schema._zod?.def?.defaultValue ?? schema._def?.defaultValue;
        return typeof defVal === 'function' ? defVal() : defVal;
    }
    if (schema instanceof ZodOptional) {
        return getFieldDefaultValue(schema.unwrap());
    }
    return undefined;
};
export const getDescription = (schema) => {
    if (!schema) {
        return undefined;
    }
    // Zod v4: description is in _zod.def.description
    const desc = schema._zod?.def?.description ?? schema._def?.description;
    if (desc) {
        return desc;
    }
    if (schema instanceof ZodOptional) {
        return getDescription(schema.unwrap());
    }
    return undefined;
};
export const toYargs = (yargs, zodSchema, options) => {
    yargsDefaults(yargs);
    try {
        const shape = zodSchema.shape;
        for (const key in shape) {
            const zodField = shape[key];
            const innerDef = getInnerSchema(zodField);
            if (!innerDef) {
                continue;
            }
            let type;
            const inner_type = getInnerType(innerDef);
            let descriptionExtra = '';
            switch (inner_type) {
                case 'string':
                case 'ZodString':
                    type = 'string';
                    break;
                case 'boolean':
                case 'ZodBoolean':
                    type = 'boolean';
                    break;
                case 'number':
                case 'ZodNumber':
                    type = 'number';
                    break;
                case 'ZodOptional':
                case 'enum':
                case 'ZodEnum':
                    type = getInnerType(innerDef);
                    {
                        const defType = innerDef._zod?.def?.type ?? innerDef._def?.typeName;
                        const values = innerDef._zod?.def?.entries
                            ? Object.values(innerDef._zod.def.entries)
                            : innerDef._def?.values;
                        if ((defType === 'enum' || defType === 'ZodEnum') && Array.isArray(values)) {
                            descriptionExtra = `\n\t ${values.join(' \n\t ')}`;
                        }
                    }
                    break;
            }
            const defaultValue = getFieldDefaultValue(zodField);
            let handled = false;
            const args = {
                type,
                default: defaultValue,
                describe: `${getDescription(zodField) ?? ''} ${descriptionExtra}`.trim()
            };
            if (options?.onKey) {
                handled = options.onKey(yargs, key, args);
            }
            if (!handled) {
                yargs.option(key, args);
            }
        }
        return yargs;
    }
    catch (error) {
        logger.error('Error processing schema:', error);
        return yargs;
    }
};
/////////////////////////////////////////////////////////
//
//  Schema Writers
//
const extension = (file) => path.parse(file).ext;
const json = (data, file, name, options) => writeFS(file, data.map((s) => zodToJsonSchema(s, name)));
export const WRITERS = {
    '.json': json
};
export const writer = (file) => WRITERS[extension(file)];
export const write = (schemas, file, name, options) => {
    if (!WRITERS[extension(file)]) {
        logger.error(`No writer found for file extension: ${extension(file)} : file: ${file}`);
        return;
    }
    logger.debug(`Writing schema to ${file} : ${name}`);
    try {
        writer(file)(schemas, file, name, options);
    }
    catch (e) {
        logger.trace(`Error writing schema to ${file} : ${name}`, e, e.stack, e.message);
    }
};
////////////////////////////////////////////////////////////////////
//
//  Schema Combinators
export const combineValidatorsOr = (validators) => {
    return z.string().refine((value) => {
        const errors = [];
        const isValid = validators.some((validator) => {
            try {
                validator.parse(value);
                return true;
            }
            catch (err) {
                errors.push(err.errors);
                return false;
            }
        });
        if (!isValid) {
            throw new z.ZodError(errors.flat());
        }
        return true;
    }, 'Invalid value for all provided validators');
};
export const combineValidatorsOrUsingZod = (validators) => {
    return validators.reduce((acc, validator) => acc.or(validator));
};
export const combineValidatorsOrUsingZod2 = (validators) => {
    return validators.reduce((acc, validator) => {
        return acc.or(validator).refine((value) => {
            try {
                acc.parse(value);
                return true;
            }
            catch (errAcc) {
                try {
                    validator.parse(value);
                    return true;
                }
                catch (errValidator) {
                    throw new z.ZodError([...errAcc.errors, ...errValidator.errors]);
                }
            }
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2NoZW1hcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQTtBQUU1QixPQUFPLEVBQUUsQ0FBQyxFQUFjLFNBQVMsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLE1BQU0sS0FBSyxDQUFBO0FBQ3ZFLE9BQU8sRUFBRSxJQUFJLElBQUksT0FBTyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDcEQsT0FBTyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFDeEUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFFckMsY0FBYyxXQUFXLENBQUE7QUFDekIsY0FBYyxjQUFjLENBQUE7QUFFNUIsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxPQUF5QixFQUFFLEdBQVcsRUFBRSxFQUFFO0lBQzFFLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsTUFBTSxDQUFDLFdBQVcsSUFBSSxVQUFVLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSx3QkFBd0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDbEwsT0FBTyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7QUFDbEMsQ0FBQyxDQUFBO0FBQ0QsTUFBTSxDQUFDLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxNQUFrQixFQUFFLE9BQWlCLEVBQUUsRUFBRSxNQUFXLEVBQVEsRUFBRTtJQUMvRixJQUFJLE1BQU0sWUFBWSxTQUFTLEVBQUUsQ0FBQztRQUM5QixLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM3QixNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQzlELENBQUM7SUFDTCxDQUFDO1NBQU0sQ0FBQztRQUNKLE1BQU0sV0FBVyxHQUFJLE1BQWMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFdBQVcsSUFBSyxNQUFjLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQztRQUNoRyxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2QsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssV0FBVyxFQUFFLENBQUMsQ0FBQTtRQUN4RCxDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUMsQ0FBQTtBQUNELE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsc0JBQXNCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtBQUU5RyxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxNQUFrQixFQUFjLEVBQUU7SUFDN0QsaUVBQWlFO0lBQ2pFLE9BQU8sTUFBTSxDQUFBO0FBQ2pCLENBQUMsQ0FBQTtBQUNELE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxDQUFDLElBQWdCLEVBQUUsRUFBRTtJQUM3QyxPQUFPLElBQUksWUFBWSxXQUFXLEVBQUUsQ0FBQztRQUNqQyxJQUFJLEdBQUksSUFBeUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUM5QyxDQUFDO0lBQ0QsT0FBTyxJQUFJLFlBQVksVUFBVSxFQUFFLENBQUM7UUFDaEMsSUFBSSxHQUFJLElBQXdCLENBQUMsYUFBYSxFQUFFLENBQUE7SUFDcEQsQ0FBQztJQUNELDhFQUE4RTtJQUM5RSxPQUFRLElBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksSUFBSyxJQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQTtBQUN4RSxDQUFDLENBQUE7QUFDRCxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxNQUFrQixFQUFFLEVBQUU7SUFDbEQsSUFBSSxNQUFNLFlBQVksVUFBVSxFQUFFLENBQUM7UUFDL0Isc0RBQXNEO1FBQ3RELE1BQU0sTUFBTSxHQUFJLE1BQWMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFlBQVksSUFBSyxNQUFjLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQztRQUM3RixPQUFPLE9BQU8sTUFBTSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM1RCxDQUFDO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDckIsQ0FBQyxDQUFBO0FBQ0QsTUFBTSxDQUFDLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxNQUFrQixFQUFtQixFQUFFO0lBQ3hFLElBQUcsQ0FBQyxNQUFNLEVBQUMsQ0FBQztRQUNSLE9BQU8sU0FBUyxDQUFBO0lBQ3BCLENBQUM7SUFDRCxJQUFJLE1BQU0sWUFBWSxVQUFVLEVBQUUsQ0FBQztRQUMvQixNQUFNLE1BQU0sR0FBSSxNQUFjLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxZQUFZLElBQUssTUFBYyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUM7UUFDN0YsT0FBTyxPQUFPLE1BQU0sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDNUQsQ0FBQztJQUNELElBQUksTUFBTSxZQUFZLFdBQVcsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sb0JBQW9CLENBQUUsTUFBMkIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDLENBQUE7QUFDSCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxNQUFrQixFQUFzQixFQUFFO0lBQ3JFLElBQUcsQ0FBQyxNQUFNLEVBQUMsQ0FBQztRQUNSLE9BQU8sU0FBUyxDQUFBO0lBQ3BCLENBQUM7SUFDRCxpREFBaUQ7SUFDakQsTUFBTSxJQUFJLEdBQUksTUFBYyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsV0FBVyxJQUFLLE1BQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDO0lBQ3pGLElBQUksSUFBSSxFQUFFLENBQUM7UUFDVCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxJQUFJLE1BQU0sWUFBWSxXQUFXLEVBQUUsQ0FBQztRQUNsQyxPQUFPLGNBQWMsQ0FBRSxNQUEyQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMsQ0FBQTtBQUNILE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxTQUF5QixFQUFFLE9BRW5FLEVBQUUsRUFBRTtJQUNELGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNwQixJQUFJLENBQUM7UUFDRCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFBO1FBQzdCLEtBQUssTUFBTSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7WUFDdEIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBZSxDQUFBO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUN6QyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ1osU0FBUTtZQUNaLENBQUM7WUFDRCxJQUFJLElBQWlELENBQUM7WUFDdEQsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQ3pDLElBQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFBO1lBQ3pCLFFBQVEsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLEtBQUssUUFBUSxDQUFDO2dCQUNkLEtBQUssV0FBVztvQkFDWixJQUFJLEdBQUcsUUFBUSxDQUFBO29CQUNmLE1BQUs7Z0JBQ1QsS0FBSyxTQUFTLENBQUM7Z0JBQ2YsS0FBSyxZQUFZO29CQUNiLElBQUksR0FBRyxTQUFTLENBQUE7b0JBQ2hCLE1BQUs7Z0JBQ1QsS0FBSyxRQUFRLENBQUM7Z0JBQ2QsS0FBSyxXQUFXO29CQUNaLElBQUksR0FBRyxRQUFRLENBQUE7b0JBQ2YsTUFBSztnQkFDVCxLQUFLLGFBQWEsQ0FBQztnQkFDbkIsS0FBSyxNQUFNLENBQUM7Z0JBQ1osS0FBSyxTQUFTO29CQUNWLElBQUksR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUE7b0JBQzdCLENBQUM7d0JBQ0csTUFBTSxPQUFPLEdBQUksUUFBZ0IsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksSUFBSyxRQUFnQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUM7d0JBQ3RGLE1BQU0sTUFBTSxHQUFJLFFBQWdCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxPQUFPOzRCQUMvQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBRSxRQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDOzRCQUNuRCxDQUFDLENBQUUsUUFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO3dCQUNyQyxJQUFJLENBQUMsT0FBTyxLQUFLLE1BQU0sSUFBSSxPQUFPLEtBQUssU0FBUyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDOzRCQUN6RSxnQkFBZ0IsR0FBRyxRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQTt3QkFDdEQsQ0FBQztvQkFDTCxDQUFDO29CQUNELE1BQUs7WUFDYixDQUFDO1lBQ0QsTUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUE7WUFDbkQsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFBO1lBQ25CLE1BQU0sSUFBSSxHQUFHO2dCQUNULElBQUk7Z0JBQ0osT0FBTyxFQUFFLFlBQVk7Z0JBQ3JCLFFBQVEsRUFBRSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUU7YUFDM0UsQ0FBQTtZQUNELElBQUcsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDO2dCQUNmLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDN0MsQ0FBQztZQUNELElBQUcsQ0FBQyxPQUFPLEVBQUMsQ0FBQztnQkFDVCxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBQyxJQUFJLENBQUMsQ0FBQTtZQUMxQixDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFBO0lBQ2hCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsTUFBTSxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUMvQyxPQUFPLEtBQUssQ0FBQTtJQUNoQixDQUFDO0FBQ0wsQ0FBQyxDQUFBO0FBQ0QseURBQXlEO0FBQ3pELEVBQUU7QUFDRixrQkFBa0I7QUFDbEIsRUFBRTtBQUNGLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQTtBQUN4RCxNQUFNLElBQUksR0FBRyxDQUFDLElBQVMsRUFBRSxJQUFZLEVBQUUsSUFBWSxFQUFFLE9BQVcsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUU3SCxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQ3BCO0lBQ0ksT0FBTyxFQUFFLElBQUk7Q0FDaEIsQ0FBQTtBQUVELE1BQU0sQ0FBQyxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO0FBRWhFLE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLE9BQXlCLEVBQUUsSUFBWSxFQUFFLElBQVksRUFBRSxPQUFXLEVBQUUsRUFBRTtJQUN4RixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDNUIsTUFBTSxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDLENBQUE7UUFDdEYsT0FBTTtJQUNWLENBQUM7SUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixJQUFJLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUNuRCxJQUFJLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDOUMsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVCxNQUFNLENBQUMsS0FBSyxDQUFDLDJCQUEyQixJQUFJLE1BQU0sSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3BGLENBQUM7QUFDTCxDQUFDLENBQUE7QUFDRCxvRUFBb0U7QUFDcEUsRUFBRTtBQUNGLHNCQUFzQjtBQUN0QixNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLFVBQTBCLEVBQUUsRUFBRTtJQUM5RCxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUMvQixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDbEIsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO1lBQzFDLElBQUksQ0FBQztnQkFDRCxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO2dCQUN0QixPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDdkIsT0FBTyxLQUFLLENBQUM7WUFDakIsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ1gsTUFBTSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7UUFDdkMsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUMsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFBO0FBQ25ELENBQUMsQ0FBQTtBQUVELE1BQU0sQ0FBQyxNQUFNLDJCQUEyQixHQUFHLENBQUMsVUFBMEIsRUFBRSxFQUFFO0lBQ3RFLE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztBQUNwRSxDQUFDLENBQUM7QUFDRixNQUFNLENBQUMsTUFBTSw0QkFBNEIsR0FBRyxDQUFDLFVBQTBCLEVBQUUsRUFBRTtJQUN2RSxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLEVBQUU7UUFDeEMsT0FBTyxHQUFHLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3RDLElBQUksQ0FBQztnQkFDRCxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNqQixPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBQUMsT0FBTyxNQUFNLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUM7b0JBQ0QsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdkIsT0FBTyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7Z0JBQUMsT0FBTyxZQUFZLEVBQUUsQ0FBQztvQkFDcEIsTUFBTSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDckUsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBIn0=