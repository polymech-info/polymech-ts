import * as path from 'path';
import { toolLogger } from '../../index.js';
import { store, get, set } from './keyv.js';
// Helper function to get storage path
const getStoragePath = (options) => {
    // For now, use default path. Later this can be configured via options
    return path.join(process.cwd(), 'memory.json');
};
// Default collection name when none provided
const DEFAULT_COLLECTION = 'no-collection';
// Helper function to process value based on format
const processValueForStorage = (value, format) => {
    switch (format) {
        case 'json':
            try {
                // Validate JSON by parsing and re-stringifying
                JSON.parse(value);
                return value;
            }
            catch (error) {
                throw new Error('Invalid JSON format provided');
            }
        case 'binary':
            // For binary, we expect base64 encoded data
            try {
                // Validate base64
                Buffer.from(value, 'base64');
                return value;
            }
            catch (error) {
                throw new Error('Invalid base64 format for binary data');
            }
        case 'text':
        default:
            return value;
    }
};
// Helper function to create memory entry
const createMemoryEntry = (value, format) => {
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
export const tools = (target, options) => {
    const logger = toolLogger('memory', options);
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
                function: async (params) => {
                    try {
                        const { collection = DEFAULT_COLLECTION, key, value, format = 'text' } = params;
                        logger.debug(`Tool::Memorize Storing ${key} in collection ${collection} as ${format}`);
                        const memoryEntry = createMemoryEntry(value, format);
                        await set(`${collection}:${key}`, memoryEntry, storagePath, collection);
                        return {
                            success: true,
                            message: `Stored ${key} in collection ${collection} as ${format}`,
                            meta: memoryEntry.meta
                        };
                    }
                    catch (error) {
                        logger.error('Error storing memory', error);
                        return {
                            success: false,
                            message: error instanceof Error ? error.message : 'Unknown error occurred'
                        };
                    }
                },
                parse: JSON.parse
            }
        },
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
                function: async (params) => {
                    try {
                        const { collection = DEFAULT_COLLECTION, key } = params;
                        logger.debug(`Tool::Recall Retrieving ${key} from collection ${collection}`);
                        const storedData = await get(`${collection}:${key}`, storagePath, collection);
                        if (storedData === undefined) {
                            return { success: false, message: `Key ${key} not found in collection ${collection}` };
                        }
                        // Handle both old format (plain string) and new format (MemoryEntry)
                        let memoryEntry;
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
                        }
                        else {
                            memoryEntry = storedData;
                        }
                        return {
                            success: true,
                            value: memoryEntry.value,
                            meta: memoryEntry.meta,
                            key,
                            collection
                        };
                    }
                    catch (error) {
                        logger.error('Error retrieving memory', error);
                        return {
                            success: false,
                            message: error instanceof Error ? error.message : 'Unknown error occurred'
                        };
                    }
                },
                parse: JSON.parse
            }
        },
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
                function: async (params) => {
                    try {
                        const { collection = DEFAULT_COLLECTION, key } = params;
                        logger.debug(`Tool::Forget Removing ${key} from collection ${collection}`);
                        const keyv = store(storagePath, collection);
                        const deleted = await keyv.delete(`${collection}:${key}`);
                        return { success: deleted, message: deleted ? `Removed ${key} from ${collection}` : `Key ${key} not found in ${collection}` };
                    }
                    catch (error) {
                        logger.error('Error removing from memory', error);
                        return {
                            success: false,
                            message: error instanceof Error ? error.message : 'Unknown error occurred'
                        };
                    }
                },
                parse: JSON.parse
            }
        },
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
                function: async (params) => {
                    try {
                        const { collection = DEFAULT_COLLECTION } = params;
                        logger.debug(`Tool::ListMemories Listing keys in collection ${collection}`);
                        // Create a Keyv instance for the specific collection to use iterator
                        const keyv = store(storagePath, collection);
                        const keys = [];
                        const entries = [];
                        try {
                            // Check if iterator method exists and use it
                            if (typeof keyv.iterator === 'function') {
                                try {
                                    // Try calling iterator without arguments first
                                    const iterator = keyv.iterator();
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
                                }
                                catch (iteratorCallError) {
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
                            }
                            else {
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
                        }
                        catch (iteratorError) {
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
                    }
                    catch (error) {
                        logger.error('Error listing memories', error);
                        return {
                            success: false,
                            message: error instanceof Error ? error.message : 'Unknown error occurred'
                        };
                    }
                },
                parse: JSON.parse
            }
        }
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtb3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi90b29scy9tZW1vcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUE7QUFJNUIsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBRzNDLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxNQUFNLFdBQVcsQ0FBQTtBQUUzQyxzQ0FBc0M7QUFDdEMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxPQUFrQixFQUFVLEVBQUU7SUFDbEQsc0VBQXNFO0lBQ3RFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDbkQsQ0FBQyxDQUFDO0FBRUYsNkNBQTZDO0FBQzdDLE1BQU0sa0JBQWtCLEdBQUcsZUFBZSxDQUFDO0FBZTNDLG1EQUFtRDtBQUNuRCxNQUFNLHNCQUFzQixHQUFHLENBQUMsS0FBYSxFQUFFLE1BQWtCLEVBQVUsRUFBRTtJQUN6RSxRQUFRLE1BQU0sRUFBRSxDQUFDO1FBQ2IsS0FBSyxNQUFNO1lBQ1AsSUFBSSxDQUFDO2dCQUNELCtDQUErQztnQkFDL0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEIsT0FBTyxLQUFLLENBQUM7WUFDakIsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQ3BELENBQUM7UUFDTCxLQUFLLFFBQVE7WUFDVCw0Q0FBNEM7WUFDNUMsSUFBSSxDQUFDO2dCQUNELGtCQUFrQjtnQkFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzdCLE9BQU8sS0FBSyxDQUFDO1lBQ2pCLENBQUM7WUFBQyxPQUFPLEtB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