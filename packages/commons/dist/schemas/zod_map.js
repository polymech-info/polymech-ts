import { z } from 'zod';
/**
 * Manages a collection of Zod schema properties
 * and combines them into a single Zod object schema.
 *
 * @template MetaType The type of metadata you want to store for each field.
 *                    Defaults to Record<string, unknown> if not provided.
 */
export class ZodMetaMap {
    fieldMap = new Map();
    /**
     * Adds a Zod schema under a specific key (property name),
     * optionally attaching typed metadata.
     *
     * @param key - The name of the property in the root object.
     * @param schema - The Zod schema for that property.
     * @param metadata - Optional metadata object (type MetaType).
     */
    add(key, schema, metadata) {
        this.fieldMap.set(key, { schema, metadata });
        return this;
    }
    /**
     * Builds and returns a root Zod object
     * that combines all properties which were added.
     */
    root() {
        const shape = {};
        for (const [key, { schema }] of this.fieldMap.entries()) {
            shape[key] = schema;
        }
        return z.object(shape);
    }
    /**
     * Retrieves the metadata for a specific key, if any.
     */
    getMetadata(key) {
        return this.fieldMap.get(key)?.metadata;
    }
    /**
     * Static factory method: creates a SchemaMetaManager
     * while letting you optionally specify the MetaType.
     *
     * Usage:
     *   const manager = SchemaMetaManager.create<MyFieldMeta>();
     */
    static create() {
        return new ZodMetaMap();
    }
    /**
     * Returns a basic UiSchema object that RJSF can use to render form controls.
     *
     * - Adds a top-level "ui:submitButtonOptions" (example).
     * - For each field, we set `ui:title` (uppercase key),
     *   `ui:description` (from Zod's .describe() if available),
     *   and a naive placeholder from the default value (if parse(undefined) succeeds).
     */
    getUISchema() {
        // Start with some top-level UI schema config (optional)
        const uiSchema = {
            'ui:submitButtonOptions': {
                props: {
                    disabled: false,
                    className: 'btn btn-info',
                },
                norender: false,
                submitText: 'Submit',
            },
        };
        for (const [key, { schema }] of this.fieldMap.entries()) {
            let fieldUi = {};
            // Use the Zod description if available
            // (Accessing `._def.description` is private/hacky, but commonly done.)
            const sAny = schema;
            if (sAny?._def?.description) {
                fieldUi['ui:description'] = sAny._def.description;
            }
            // RJSF usually reads 'title' from JSON schema. But if you want
            // to override it in UI schema, you can do so:
            fieldUi['ui:title'] = key[0].toUpperCase() + key.substr(1).toLowerCase();
            // If the Zod schema allows a default, we can parse(undefined) to get it.
            try {
                const defaultVal = schema.parse(undefined);
                // There's no official 'ui:default' in RJSF, but you could do a placeholder:
                fieldUi['ui:placeholder'] = defaultVal;
            }
            catch {
                // no default
            }
            fieldUi = {
                ...fieldUi,
                ...this.getMetadata(key),
            };
            uiSchema[key] = fieldUi;
        }
        return uiSchema;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9kX21hcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2hlbWFzL3pvZF9tYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLENBQUMsRUFBeUIsTUFBTSxLQUFLLENBQUM7QUFFL0M7Ozs7OztHQU1HO0FBQ0gsTUFBTSxPQUFPLFVBQVU7SUFDWCxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBR3ZCLENBQUM7SUFFSjs7Ozs7OztPQU9HO0lBQ0gsR0FBRyxDQUF1QixHQUFXLEVBQUUsTUFBUyxFQUFFLFFBQW1CO1FBQ2pFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJO1FBQ0EsTUFBTSxLQUFLLEdBQStCLEVBQUUsQ0FBQztRQUM3QyxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUN0RCxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDO1FBQ3hCLENBQUM7UUFDRCxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsV0FBVyxDQUFDLEdBQVc7UUFDbkIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxRQUFRLENBQUM7SUFDNUMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxNQUFNO1FBQ1QsT0FBTyxJQUFJLFVBQVUsRUFBTSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsV0FBVztRQUNQLHdEQUF3RDtRQUN4RCxNQUFNLFFBQVEsR0FBNEI7WUFDdEMsd0JBQXdCLEVBQUU7Z0JBQ3RCLEtBQUssRUFBRTtvQkFDSCxRQUFRLEVBQUUsS0FBSztvQkFDZixTQUFTLEVBQUUsY0FBYztpQkFDNUI7Z0JBQ0QsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsVUFBVSxFQUFFLFFBQVE7YUFDdkI7U0FDSixDQUFDO1FBRUYsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7WUFDdEQsSUFBSSxPQUFPLEdBQTRCLEVBQUcsQ0FBQztZQUMzQyx1Q0FBdUM7WUFDdkMsdUVBQXVFO1lBQ3ZFLE1BQU0sSUFBSSxHQUFHLE1BQWEsQ0FBQztZQUMzQixJQUFJLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ3RELENBQUM7WUFFRCwrREFBK0Q7WUFDL0QsOENBQThDO1lBQzlDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtZQUV4RSx5RUFBeUU7WUFDekUsSUFBSSxDQUFDO2dCQUNELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzNDLDRFQUE0RTtnQkFDNUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsVUFBVSxDQUFDO1lBQzNDLENBQUM7WUFBQyxNQUFNLENBQUM7Z0JBQ0wsYUFBYTtZQUNqQixDQUFDO1lBQ0QsT0FBTyxHQUFHO2dCQUNOLEdBQUcsT0FBTztnQkFDVixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO2FBQzNCLENBQUE7WUFDRCxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBQzVCLENBQUM7UUFDRCxPQUFPLFFBQVEsQ0FBQztJQUNwQixDQUFDO0NBQ0oifQ==