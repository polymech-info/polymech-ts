import type { GridFilterModel, GridSortModel, GridColumnVisibilityModel } from '@mui/x-data-grid';

// Convert filter model to human-readable URL params
export const filterModelToParams = (filterModel: GridFilterModel): Record<string, string> => {
    const params: Record<string, string> = {};

    filterModel.items.forEach((item) => {
        if (item.field && item.operator && item.value !== undefined && item.value !== null) {
            // Create param like: filter_city_contains=Barcelona
            const key = `filter_${item.field}_${item.operator}`;
            params[key] = String(item.value);
        }
    });

    return params;
};

// Convert URL params back to filter model
export const paramsToFilterModel = (searchParams: URLSearchParams): GridFilterModel => {
    const items: any[] = [];

    searchParams.forEach((value, key) => {
        if (key.startsWith('filter_')) {
            // Parse: filter_city_contains -> field: city, operator: contains
            // Handle potential spaces in keys
            const cleanKey = key.trim();
            const parts = cleanKey.replace('filter_', '').split('_');
            if (parts.length >= 2) {
                const operator = parts.pop(); // Last part is operator
                const field = parts.join('_'); // Rest is field name (handles fields with underscores)

                if (operator) {
                    items.push({
                        field,
                        operator: operator.trim(),
                        value,
                    });
                }
            }
        }
    });

    return { items };
};

// Convert sort model to URL params
export const sortModelToParams = (sortModel: GridSortModel): Record<string, string> => {
    const params: Record<string, string> = {};
    if (sortModel.length > 0) {
        const { field, sort } = sortModel[0];
        if (sort) {
            params.sort = `${field}:${sort}`;
        }
    }
    return params;
};

// Convert URL params back to sort model
export const paramsToSortModel = (searchParams: URLSearchParams): GridSortModel => {
    const sortParam = searchParams.get('sort');
    if (sortParam) {
        // Handle encoded spaces or trailing spaces
        const cleanParam = sortParam.trim();
        const [field, sort] = cleanParam.split(':');

        const cleanSort = sort?.trim();

        if (field && (cleanSort === 'asc' || cleanSort === 'desc')) {
            return [{ field, sort: cleanSort }];
        }
    }
    return [];
};

const DEFAULT_HIDDEN_COLUMNS = ['address', 'country', 'phone'];

// Convert visibility model to URL params
export const visibilityModelToParams = (model: GridColumnVisibilityModel): Record<string, string> => {
    const hiddenCols = Object.entries(model)
        .filter(([_, visible]) => !visible)
        .map(([field]) => field);

    // Sort logic to make comparison consistent (optional but good for stability)
    hiddenCols.sort();
    const defaultHidden = [...DEFAULT_HIDDEN_COLUMNS].sort();

    const isDefault =
        hiddenCols.length === defaultHidden.length &&
        hiddenCols.every((val, index) => val === defaultHidden[index]);

    if (isDefault) {
        return {}; // No param needed if it matches default
    }

    if (hiddenCols.length === 0) {
        return { hidden: '' }; // Explicitly show all (override default)
    }

    return { hidden: hiddenCols.join(',') };
};

// Convert URL params back to visibility model
export const paramsToVisibilityModel = (searchParams: URLSearchParams): GridColumnVisibilityModel => {
    const hiddenParam = searchParams.get('hidden');

    // Case 1: No param -> Use defaults
    if (hiddenParam === null) {
        const model: GridColumnVisibilityModel = {};
        DEFAULT_HIDDEN_COLUMNS.forEach(col => {
            model[col] = false;
        });
        return model;
    }

    // Case 2: Empty param (hidden=) -> Show all
    if (hiddenParam === '') {
        return {};
    }

    // Case 3: Explicit hidden columns
    const model: GridColumnVisibilityModel = {};
    hiddenParam.split(',').forEach(field => {
        if (field) model[field] = false;
    });
    return model;
};

// Get column order from URL params
export const paramsToColumnOrder = (searchParams: URLSearchParams): string[] => {
    const orderParam = searchParams.get('order');
    return orderParam ? orderParam.split(',') : [];
};
