import * as path from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'
import { isString } from '@polymech/core/primitives'

import { toolLogger } from '../../index.js'
import { IKBotTask } from '../../types.js'

import { store, get, set } from './keyv.js'

// Helper function to get storage path
const getStoragePath = (options: IKBotTask): string => {
    // For now, use default path. Later this can be configured via options
    return path.join(process.cwd(), 'memory.json');
};

// Default collection name when none provided
const DEFAULT_COLLECTION = 'no-collection';

// Supported data formats
type DataFormat = 'text' | 'json' | 'binary';

// Memory entry structure
interface MemoryEntry {
    value: string;
    meta: {
        type: DataFormat;
        created: string;
        updated: string;
    };
}

// Helper function to process value based on format
const processValueForStorage = (value: string, format: DataFormat): string => {
    switch (format) {
        case 'json':
            try {
                // Validate JSON by parsing and re-stringifying
                JSON.parse(value);
                return value;
            } catch (error) {
                throw new Error('Invalid JSON format provided');
            }
        case 'binary':
            // For binary, we expect base64 encoded data
            try {
                // Validate base64
                Buffer.from(value, 'base64');
                return value;
            } catch (error) {
                throw new Error('Invalid base64 format for binary data');
            }
        case 'text':
        default:
            return value;
    }
};

// Helper function to create memory entry
const createMemoryEntry = (value: string, format: DataFormat): MemoryEntry => {
    const now = new Date().toISOString();
    return {
        value: processValueForStorage(value, format),
        meta: {
            type: format,
            created: now,
            updated: now
        }
    };
};

export const tools = (target: string, options: IKBotTask): Array<any> => {
    const logger = toolLogger('memory', options)
    const storagePath = getStoragePath(options);
    
    return [
        {
            type: 'function',
            function: {
                name: 'memorize',
                description: `Store information in memory as a key-value collection with format support. Supports text, JSON, and binary (base64) formats.
                
Returns: {
  success: boolean,
  message: string,
  meta: {
    type: "text" | "json" | "binary",
    created: string (ISO timestamp),
    updated: string (ISO timestamp)
  }
}`,
                parameters: {
                    type: 'object',
                    properties: {
                        collection: { 
                            type: 'string',
                            description: 'Collection name to organize related data (defaults to "no-collection" if not provided). Acts like a namespace.',
                            optional: true
                        },
                        key: { 
                            type: 'string',
                            description: 'Unique identifier for the data within the collection. Must be a string.'
                        },
                        value: { 
                            type: 'string',
                            description: 'The data to store. For format="text": any string. For format="json": valid JSON string. For format="binary": base64 encoded data.'
                        },
                        format: {
                            type: 'string',
                            description: 'Data format type. "text" for plain text (default), "json" for JSON data (validates structure), "binary" for base64 encoded binary data.',
                            enum: ['text', 'json', 'binary'],
                            optional: true
                        }
                    },
                    required: ['key', 'value']
                },
                function: async (params: any) => {
                    try {
                        const { collection = DEFAULT_COLLECTION, key, value, format = 'text' } = params;
                        logger.debug(`Tool::Memorize Storing ${key} in collection ${collection} as ${format}`);
                        
                        const memoryEntry = createMemoryEntry(value, format as DataFormat);
                        await set(`${collection}:${key}`, memoryEntry, storagePath, collection);
                        
                        return { 
                            success: true, 
                            message: `Stored ${key} in collection ${collection} as ${format}`,
                            meta: memoryEntry.meta
                        };
                    } catch (error) {
                        logger.error('Error storing memory', error);
                        return { 
                            success: false, 
                            message: error instanceof Error ? error.message : 'Unknown error occurred'
                        };
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
        {
            type: 'function',
            function: {
                name: 'recall',
                description: `Retrieve stored information from memory by collection and key, including format metadata.
                
Returns: {
  success: boolean,
  value?: string (the stored data),
  meta?: {
    type: "text" | "json" | "binary",
    created: string (ISO timestamp),
    updated: string (ISO timestamp)
  },
  key: string,
  collection: string,
  message?: string (error message if success=false)
}`,
                parameters: {
                    type: 'object',
                    properties: {
                        collection: { 
                            type: 'string',
                            description: 'Collection name to retrieve from (defaults to "no-collection" if not provided). Must match the collection used when storing.',
                            optional: true
                        },
                        key: { 
                            type: 'string',
                            description: 'The unique identifier of the data to retrieve. Must match the key used when storing.'
                        }
                    },
                    required: ['key']
                },
                function: async (params: any) => {
                    try {
                        const { collection = DEFAULT_COLLECTION, key } = params;
                        logger.debug(`Tool::Recall Retrieving ${key} from collection ${collection}`);
                        
                        const storedData = await get(`${collection}:${key}`, storagePath, collection);
                        if (storedData === undefined) {
                            return { success: false, message: `Key ${key} not found in collection ${collection}` };
                        }

                        // Handle both old format (plain string) and new format (MemoryEntry)
                        let memoryEntry: MemoryEntry;
                        if (typeof storedData === 'string') {
                            // Legacy format - convert to new format
                            memoryEntry = {
                                value: storedData,
                                meta: {
                                    type: 'text',
                                    created: new Date().toISOString(),
                                    updated: new Date().toISOString()
                                }
                            };
                        } else {
                            memoryEntry = storedData as MemoryEntry;
                        }

                        return { 
                            success: true, 
                            value: memoryEntry.value,
                            meta: memoryEntry.meta,
                            key, 
                            collection 
                        };
                    } catch (error) {
                        logger.error('Error retrieving memory', error);
                        return { 
                            success: false, 
                            message: error instanceof Error ? error.message : 'Unknown error occurred'
                        };
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
        {
            type: 'function',
            function: {
                name: 'forget',
                description: `Remove a specific key from memory collection.
                
Returns: {
  success: boolean,
  message: string (confirmation or error message)
}`,
                parameters: {
                    type: 'object',
                    properties: {
                        collection: { 
                            type: 'string',
                            description: 'Collection name to remove from (defaults to "no-collection" if not provided). Must match the collection where the key was stored.',
                            optional: true
                        },
                        key: { 
                            type: 'string',
                            description: 'The unique identifier of the data to remove. Must match exactly the key used when storing.'
                        }
                    },
                    required: ['key']
                },
                function: async (params: any) => {
                    try {
                        const { collection = DEFAULT_COLLECTION, key } = params;
                        logger.debug(`Tool::Forget Removing ${key} from collection ${collection}`);
                        
                        const keyv = store(storagePath, collection);
                        const deleted = await keyv.delete(`${collection}:${key}`);
                        return { success: deleted, message: deleted ? `Removed ${key} from ${collection}` : `Key ${key} not found in ${collection}` };
                    } catch (error) {
                        logger.error('Error removing from memory', error);
                        return { 
                            success: false, 
                            message: error instanceof Error ? error.message : 'Unknown error occurred'
                        };
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
        {
            type: 'function',
            function: {
                name: 'list_memories',
                description: `List all keys in a specific collection using Keyv's iterator method.
                
Returns: {
  success: boolean,
  collection: string (the collection name),
  keys: string[] (array of key names in the collection),
  entries: Array<{
    key: string,
    meta?: {
      type: "text" | "json" | "binary",
      created: string (ISO timestamp),
      updated: string (ISO timestamp)
    }
  }>,
  count: number (total number of keys),
  message?: string (info or error message)
}`,
                parameters: {
                    type: 'object',
                    properties: {
                        collection: { 
                            type: 'string',
                            description: 'Collection name to list keys from (defaults to "no-collection" if not provided). Will return all keys stored in this collection namespace.',
                            optional: true
                        }
                    },
                    required: []
                },
                function: async (params: any) => {
                    try {
                        const { collection = DEFAULT_COLLECTION } = params;
                        
                        logger.debug(`Tool::ListMemories Listing keys in collection ${collection}`);
                        
                        // Create a Keyv instance for the specific collection to use iterator
                        const keyv = store(storagePath, collection);
                        const keys: string[] = [];
                        const entries: { key: string; meta?: any }[] = [];
                        
                        try {
                            // Check if iterator method exists and use it
                            if (typeof keyv.iterator === 'function') {
                                try {
                                    // Try calling iterator without arguments first
                                    const iterator = (keyv as any).iterator();
                                    for await (const [key, value] of iterator) {
                                        // Remove the collection prefix from the key to get the clean key name
                                        const cleanKey = key.replace(`${collection}:`, '');
                                        keys.push(cleanKey);
                                        
                                        // Try to extract metadata if it's a MemoryEntry
                                        let meta = undefined;
                                        if (value && typeof value === 'object' && value.meta) {
                                            meta = value.meta;
                                        }
                                        
                                        entries.push({ key: cleanKey, meta });
                                    }
                                } catch (iteratorCallError) {
                                    logger.warn(`Tool::ListMemories Iterator call failed:`, iteratorCallError);
                                    // Fall through to the not available case
                                    return { 
                                        success: true, 
                                        collection,
                                        keys: [],
                                        entries: [],
                                        count: 0,
                                        message: 'Iterator call failed. Unable to list keys.'
                                    };
                                }
                            } else {
                                // Iterator not available, provide helpful message
                                logger.warn(`Tool::ListMemories Iterator method not available for Keyv instance`);
                                return { 
                                    success: true, 
                                    collection,
                                    keys: [],
                                    entries: [],
                                    count: 0,
                                    message: 'Iterator method not available in this Keyv version. Use individual key operations instead.'
                                };
                            }
                            
                            return { 
                                success: true, 
                                collection,
                                keys,
                                entries,
                                count: keys.length
                            };
                        } catch (iteratorError) {
                            // If iterator fails, fall back to returning basic info
                            logger.warn(`Tool::ListMemories Iterator failed for collection ${collection}:`, iteratorError);
                            return { 
                                success: true, 
                                collection,
                                keys: [],
                                entries: [],
                                count: 0,
                                message: 'Iterator failed or collection is empty'
                            };
                        }
                    } catch (error) {
                        logger.error('Error listing memories', error);
                        return { 
                            success: false, 
                            message: error instanceof Error ? error.message : 'Unknown error occurred'
                        };
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>
    ]
};
