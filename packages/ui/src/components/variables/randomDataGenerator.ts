// Helper functions for generating random form data based on JSON schema

export const generateRandomData = (schema: any): any => {
    if (!schema || !schema.properties) return {};

    const data: any = {};
    const sampleTexts = ['Lorem ipsum dolor sit amet', 'Sample text content', 'Example value here', 'Test data entry', 'Demo content item'];
    const sampleNames = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Anderson'];
    const sampleEmails = ['alice@example.com', 'bob@test.com', 'charlie@demo.org', 'diana@sample.net', 'eve@mail.com'];

    Object.keys(schema.properties).forEach(key => {
        const prop = schema.properties[key];
        const type = prop.type;
        const fieldName = key.toLowerCase();

        switch (type) {
            case 'string':
                // Try to generate contextual data based on field name
                if (fieldName.includes('email')) {
                    data[key] = sampleEmails[Math.floor(Math.random() * sampleEmails.length)];
                } else if (fieldName.includes('name')) {
                    data[key] = sampleNames[Math.floor(Math.random() * sampleNames.length)];
                } else if (fieldName.includes('phone')) {
                    data[key] = `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
                } else if (fieldName.includes('url') || fieldName.includes('link')) {
                    data[key] = `https://example.com/${key}`;
                } else {
                    data[key] = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
                }
                break;
            case 'number':
            case 'integer':
                // Generate contextual numbers
                if (fieldName.includes('age')) {
                    data[key] = Math.floor(Math.random() * 50) + 18;
                } else if (fieldName.includes('price') || fieldName.includes('cost')) {
                    data[key] = Math.floor(Math.random() * 10000) / 100;
                } else if (fieldName.includes('quantity') || fieldName.includes('count')) {
                    data[key] = Math.floor(Math.random() * 20) + 1;
                } else {
                    data[key] = Math.floor(Math.random() * 100) + 1;
                }
                break;
            case 'boolean':
                data[key] = Math.random() > 0.5;
                break;
            case 'array':
                const itemCount = Math.floor(Math.random() * 3) + 1;
                data[key] = Array.from({ length: itemCount }, (_, index) => {
                    if (prop.items) {
                        if (prop.items.type === 'object' && prop.items.properties) {
                            return generateRandomData(prop.items);
                        } else if (prop.items.type === 'string') {
                            return `Item ${index + 1}`;
                        } else if (prop.items.type === 'number') {
                            return Math.floor(Math.random() * 100);
                        }
                    }
                    return `Item ${index + 1}`;
                });
                break;
            case 'object':
                data[key] = prop.properties ? generateRandomData(prop) : {};
                break;
            default:
                data[key] = null;
        }
    });

    return data;
};
