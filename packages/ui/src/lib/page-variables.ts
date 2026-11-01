
export const normalizeValue = (val: any): any => {
    if (val === null || val === undefined) return '';
    return val;
};

export const mergePageVariables = (page: any, userVariables: Record<string, any> = {}): Record<string, any> => {
    const globalVariables: Record<string, any> = {
        showAuthor: true,
        showDate: true,
        showCategories: true,
        showActions: true,
        showParent: true,
        showTitle: true,
        showToc: true,
        showLastUpdated: true,
        showFooter: true
    };

    // 0. User Variables (Base)
    Object.entries(userVariables).forEach(([k, v]) => {
        globalVariables[k] = normalizeValue(v);
    });

    // Category Variables
    if (page.category_paths && Array.isArray(page.category_paths)) {
        // Flatten all categories across all paths
        const allCategories = page.category_paths.flat();
        for (const cat of allCategories) {
            if (cat.meta?.variables) {
                Object.entries(cat.meta.variables).forEach(([k, v]) => {
                    globalVariables[k] = normalizeValue(v);
                });
            }
        }
    }

    // Type Values
    if (page.meta?.typeValues) {
        Object.values(page.meta.typeValues).forEach((typeVal: any) => {
            if (typeVal && typeof typeVal === 'object') {
                Object.entries(typeVal).forEach(([k, v]) => {
                    globalVariables[k] = normalizeValue(v);
                });
            }
        });
    }

    // Page Variables (Highest Precedence)
    if (page.meta?.variables) {
        Object.entries(page.meta.variables).forEach(([k, v]) => {
            globalVariables[k] = normalizeValue(v);
        });
    }

    return globalVariables;
};
