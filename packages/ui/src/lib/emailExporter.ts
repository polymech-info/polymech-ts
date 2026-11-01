import { PageLayout, LayoutContainer, WidgetInstance, AnyContainer, FlexibleContainer, ColumnDef } from '@/modules/layout/LayoutManager';
import { widgetRegistry } from './widgetRegistry';
import { template } from '@/lib/variables';
import { marked } from 'marked';

export const generateEmailHtml = async (layout: PageLayout, rootTemplateUrl: string): Promise<string> => {
    try {
        // 1. Fetch Root Template
        const rootRes = await fetch(rootTemplateUrl);
        if (!rootRes.ok) throw new Error(`Failed to load root template: ${rootTemplateUrl}`);
        let rootHtml = await rootRes.text();

        // 2. Resolve Root Template Variables (e.g. ${title})
        // Map layout properties to variables. We map 'name' to 'title' for common usage.
        const rootVars: Record<string, any> = {
            ...layout,
            title: layout.name,
            SOURCE: '${SOURCE}'
        };
        rootHtml = template(rootHtml, rootVars, false);

        // 3. Generate Content Body
        const contentHtml = await generateContainerHtml(layout.containers);

        // 4. Inject Content
        if (rootHtml.includes('${SOURCE}')) {
            return rootHtml.replace('${SOURCE}', contentHtml);
        } else {
            return rootHtml.replace('</body>', `${contentHtml}</body>`);
        }
    } catch (error) {
        console.error("Email generation failed:", error);
        throw error;
    }
};

const generateContainerHtml = async (containers: AnyContainer[]): Promise<string> => {
    let html = '';

    // Sort containers
    const sortedContainers = [...containers].sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const container of sortedContainers) {
        if (container.type === 'flex-container') {
            html += await generateFlexContainerHtml(container as FlexibleContainer);
            continue;
        }
        const gap = container.gap || 0;

        // Container Table
        html += `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: ${gap}px; min-width: 100%;">`;
        html += `<tr><td align="center" valign="top">`;
        html += `<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>`;

        if (container.columns === 1) {
            // Stacked vertical
            html += `<td width="100%" valign="top">`;
            const sortedWidgets = [...container.widgets].sort((a, b) => (a.order || 0) - (b.order || 0));

            for (const widget of sortedWidgets) {
                html += await generateWidgetHtml(widget);
            }
            if (container.children?.length > 0) {
                html += await generateContainerHtml(container.children);
            }
            html += `</td>`;
        } else {
            // Grid Layout
            const colWidth = Math.floor(100 / container.columns);
            const sortedWidgets = [...container.widgets].sort((a, b) => (a.order || 0) - (b.order || 0));

            for (let i = 0; i < sortedWidgets.length; i += container.columns) {
                const rowWidgets = sortedWidgets.slice(i, i + container.columns);
                if (i > 0) html += `</tr><tr>`;

                for (const widget of rowWidgets) {
                    html += `<td width="${colWidth}%" valign="top">`;
                    html += await generateWidgetHtml(widget);
                    html += `</td>`;
                }

                // Filler cells
                if (rowWidgets.length < container.columns) {
                    for (let j = rowWidgets.length; j < container.columns; j++) {
                        html += `<td width="${colWidth}%">&nbsp;</td>`;
                    }
                }
            }
        }

        html += `</tr></table>`;
        html += `</td></tr>`;
        html += `</table>`;
    }

    return html;
};

const generateWidgetHtml = async (widget: WidgetInstance): Promise<string> => {
    const def = widgetRegistry.get(widget.widgetId);
    if (!def) return `<!-- Missing Widget: ${widget.widgetId} -->`;

    const templateUrl = def.metadata.defaultProps?.__templateUrl;

    if (templateUrl) {
        try {
            const res = await fetch(templateUrl);
            if (res.ok) {
                const content = await res.text();

                // Process props for markdown conversion
                const processedProps = { ...(widget.props || {}) };
                if (def.metadata.configSchema) {
                    for (const [key, schema] of Object.entries(def.metadata.configSchema)) {
                        if ((schema as any).type === 'markdown' && typeof processedProps[key] === 'string') {
                            try {
                                processedProps[key] = await marked.parse(processedProps[key]);
                            } catch (e) {
                                console.warn(`Failed to parse markdown for widget ${widget.widgetId} prop ${key}`, e);
                            }
                        }
                    }
                }

                // Perform Substitution using helper
                return template(content, processedProps, false);
            }
        } catch (e) {
            console.error(`Failed to fetch template for ${widget.widgetId}`, e);
        }
    }
    return `<!-- Widget Content: ${widget.widgetId} -->`;
};

// ─── Flex Container Email Rendering ─────────────────────────────────────

function columnsToPercentages(columns: ColumnDef[]): number[] {
    const totalFr = columns.reduce((sum, c) => {
        if (c.unit === 'fr') return sum + c.width;
        return sum;
    }, 0);

    if (totalFr === 0) {
        // Fallback: equal distribution
        return columns.map(() => Math.floor(100 / columns.length));
    }

    return columns.map(c => {
        if (c.unit === '%') return c.width;
        if (c.unit === 'fr') return Math.round((c.width / totalFr) * 100);
        // px/rem: just use equal fallback
        return Math.floor(100 / columns.length);
    });
}

const generateFlexContainerHtml = async (container: FlexibleContainer): Promise<string> => {
    const gap = container.gap || 0;
    let html = '';

    // Group widgets by cell
    const widgetsByCell = new Map<string, WidgetInstance[]>();
    const sortedWidgets = [...container.widgets].sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const w of sortedWidgets) {
        const key = `${(w as any).rowId || ''}:${(w as any).column ?? 0}`;
        const arr = widgetsByCell.get(key) || [];
        arr.push(w);
        widgetsByCell.set(key, arr);
    }

    for (const row of container.rows) {
        const percentages = columnsToPercentages(row.columns);
        const colGap = row.gap ?? gap;
        const halfGap = Math.round(colGap / 2);
        const colCount = row.columns.length;

        // Outer row wrapper
        html += `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: ${gap}px; min-width: 100%;">`;
        html += `<tr><td align="center" valign="top">`;

        // MSO conditional for Outlook
        html += `<!--[if mso]><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><![endif]-->`;

        for (let colIdx = 0; colIdx < colCount; colIdx++) {
            const pct = percentages[colIdx];
            const cellKey = `${row.id}:${colIdx}`;
            const cellWidgets = widgetsByCell.get(cellKey) || [];

            const padLeft = colIdx > 0 ? halfGap : 0;
            const padRight = colIdx < colCount - 1 ? halfGap : 0;
            const padStyle = `padding-left:${padLeft}px; padding-right:${padRight}px;`;

            // MSO td
            html += `<!--[if mso]><td width="${pct}%" valign="top" style="${padStyle}"><![endif]-->`;

            // Modern column using inline-block
            html += `<div style="display:inline-block; width:${pct}%; vertical-align:top; box-sizing:border-box; ${padStyle}">`;

            for (const widget of cellWidgets) {
                html += await generateWidgetHtml(widget);
            }

            if (cellWidgets.length === 0) {
                html += '&nbsp;';
            }

            html += `</div>`;

            html += `<!--[if mso]></td><![endif]-->`;
        }

        html += `<!--[if mso]></tr></table><![endif]-->`;
        html += `</td></tr>`;
        html += `</table>`;
    }

    return html;
};

export { columnsToPercentages };
