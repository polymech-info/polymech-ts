import { HtmlWidget } from '@/components/widgets/HtmlWidget';
import { widgetRegistry } from '@/lib/widgetRegistry';

export function useWidgetLoader() {
    const loadWidgetBundle = async (url: string) => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to load library definition from ${url}`);

            const library = await res.json();
            const { widgets, name: contextName, root } = library;

            if (!widgets || !Array.isArray(widgets)) {
                throw new Error('Invalid library format: widgets array missing');
            }

            let count = 0;
            const bundleBase = url.substring(0, url.lastIndexOf('/'));

            // Resolve Root Template URL
            let rootTemplateUrl = '';
            if (root) {
                rootTemplateUrl = root.startsWith('./')
                    ? `${bundleBase}/${root.substring(2)}`
                    : `${bundleBase}/${root}`;
            }

            // Parallel fetch of all templates to generate schemas
            const widgetPromises = widgets.map(async (w: any) => {
                const widgetId = `${contextName}.${w.name.toLowerCase().replace(/\s+/g, '-')}`;
                const templatePath = w.template.startsWith('./')
                    ? `${bundleBase}/${w.template.substring(2)}`
                    : `${bundleBase}/${w.template}`;

                // Fetch template content to detect placeholders
                let configSchema: Record<string, any> = {};
                let defaultProps: Record<string, any> = {
                    __templateUrl: templatePath
                };

                try {
                    const tplRes = await fetch(templatePath);
                    if (tplRes.ok) {
                        const html = await tplRes.text();
                        // Support both [[variable]] and ${variable} syntax
                        // [[variable]] -> match[1]
                        // ${variable} -> match[2]
                        const placeholderRegex = /\[\[(.*?)\]\]|\$\{([^\s:}]+)(?::([^\s:}]+))?\}/g;

                        let match;
                        const placeholders = new Set<string>();
                        while ((match = placeholderRegex.exec(html)) !== null) {
                            // key is either match[1] (for [[ ]]) or match[2] (for ${ })
                            const key = match[1] || match[2];
                            if (key && key !== 'content') { // 'content' is often special, but we can treat it as a prop
                                placeholders.add(key);
                            }
                            if (match[1] || match[2]) placeholders.add(match[1] || match[2]);
                        }

                        // Merge with manually defined schema from library.json
                        if (w.configSchema) {
                            configSchema = { ...configSchema, ...w.configSchema };
                        }
                        if (w.defaultProps) {
                            defaultProps = { ...defaultProps, ...w.defaultProps };
                        }

                        placeholders.forEach(key => {
                            // Skip if already defined in manual schema
                            if (configSchema[key]) return;

                            // Infers type based on key name
                            const isImage = key.toLowerCase().includes('image') || key.toLowerCase().includes('src') || key.toLowerCase().includes('picture');

                            configSchema[key] = {
                                label: key,
                                type: isImage ? 'imagePicker' : 'text',
                                default: isImage ? 'https://picsum.photos/200/300' : '',
                                description: `Value for ${key}`
                            };
                            if (defaultProps[key] === undefined) {
                                defaultProps[key] = isImage ? 'https://picsum.photos/200/300' : '';
                            }
                        });
                    }
                } catch (e) {
                    console.warn(`Failed to inspect template ${templatePath}`, e);
                }

                widgetRegistry.register({
                    component: (props: any) => <HtmlWidget src={templatePath} {...props} />,
                    metadata: {
                        id: widgetId,
                        name: w.name,
                        category: 'email',
                        description: `Email widget: ${w.name}`,
                        tags: ['email', 'html'],
                        defaultProps: defaultProps,
                        configSchema: configSchema
                    }
                });
                count++;
            });

            await Promise.all(widgetPromises);

            console.log(`[Playground] Loaded ${count} widgets from ${url}`);

            return { count, rootTemplateUrl };
        } catch (e) {
            console.error(`Failed to load bundle ${url}`, e);
            throw e;
        }
    };

    return { loadWidgetBundle };
}
