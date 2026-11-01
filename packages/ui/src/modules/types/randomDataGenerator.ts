// Helper functions for generating random form data based on JSON schema

const generateValueForSchema = (prop: any, key: string): any => {
    const type = prop.type;
    const fieldName = key.toLowerCase();
    const sampleTexts = ['Lorem ipsum dolor sit amet', 'Sample text content', 'Example value here', 'Test data entry', 'Demo content item'];
    const sampleNames = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Anderson'];
    const sampleEmails = ['alice@example.com', 'bob@test.com', 'charlie@demo.org', 'diana@sample.net', 'eve@mail.com'];

    switch (type) {
        case 'string':
            if (prop.enum && Array.isArray(prop.enum) && prop.enum.length > 0) {
                return prop.enum[Math.floor(Math.random() * prop.enum.length)];
            }
            if (fieldName.includes('email')) {
                return sampleEmails[Math.floor(Math.random() * sampleEmails.length)];
            } else if (fieldName.includes('name')) {
                return sampleNames[Math.floor(Math.random() * sampleNames.length)];
            } else if (fieldName.includes('phone')) {
                return `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
            } else if (fieldName.includes('url') || fieldName.includes('link')) {
                return `https://example.com/${key}`;
            } else {
                return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
            }
        case 'number':
        case 'integer':
            if (fieldName.includes('age')) {
                return Math.floor(Math.random() * 50) + 18;
            } else if (fieldName.includes('price') || fieldName.includes('cost')) {
                return Math.floor(Math.random() * 10000) / 100;
            } else if (fieldName.includes('quantity') || fieldName.includes('count')) {
                return Math.floor(Math.random() * 20) + 1;
            } else {
                return Math.floor(Math.random() * 100) + 1;
            }
        case 'boolean':
            return Math.random() > 0.5;
        case 'array':
            if (prop.uniqueItems && prop.items?.enum && Array.isArray(prop.items.enum)) {
                const allFlags = prop.items.enum as string[];
                const count = Math.min(
                    Math.floor(Math.random() * allFlags.length) + 1,
                    allFlags.length
                );
                const shuffled = [...allFlags].sort(() => Math.random() - 0.5);
                return shuffled.slice(0, count);
            } else {
                const itemCount = Math.floor(Math.random() * 3) + 1;
                return Array.from({ length: itemCount }, (_, index) => {
                    if (prop.items) {
                        if (prop.items.type === 'object' && prop.items.properties) {
                            return generateRandomData(prop.items);
                        } else if (prop.items.type === 'string') {
                            if (prop.items.enum && Array.isArray(prop.items.enum)) {
                                return prop.items.enum[Math.floor(Math.random() * prop.items.enum.length)];
                            }
                            return `Item ${index + 1}`;
                        } else if (prop.items.type === 'number') {
                            return Math.floor(Math.random() * 100);
                        }
                    }
                    return `Item ${index + 1}`;
                });
            }
        case 'object':
            return prop.properties ? generateRandomData(prop) : {};
        default:
            return null;
    }
};

export const generateRandomData = (schema: any): any => {
    if (!schema) return null;

    if (schema.type === 'object' && schema.properties) {
        const data: any = {};
        Object.keys(schema.properties).forEach(key => {
            data[key] = generateValueForSchema(schema.properties[key], key);
        });
        return data;
    }

    return generateValueForSchema(schema, 'root');
};
