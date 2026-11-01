import React from 'react';
import type { GridColDef } from '@mui/x-data-grid';
import { translate } from '@/i18n';
import type { PlacesAiGridFilterDef } from '../client-gridsearch';

/** Column title: optional display label, else the technical field id (not the old default "New filter"). */
function aiFilterHeaderName(def: PlacesAiGridFilterDef): string {
    const t = def.label?.trim() ?? '';
    if (!t || t === translate('New filter')) {
        return def.targetField;
    }
    return t;
}

/** Dynamic MUI columns for `meta.llm_grid_filters` entries; `field` matches `def.targetField`. */
export function useAiGridColumns(defs: PlacesAiGridFilterDef[]): GridColDef[] {
    const enabled = React.useMemo(() => defs.filter((d) => d.enabled !== false && d.targetField), [defs]);

    return React.useMemo(
        () =>
            enabled.map((def) => ({
                field: def.targetField,
                headerName: aiFilterHeaderName(def),
                ...(def.valueType === 'number'
                    ? { type: 'number' as const }
                    : def.valueType === 'string'
                      ? { type: 'string' as const }
                      : {}),
                width: 140,
                sortable: true,
                valueGetter: (_v: unknown, row: Record<string, unknown>) => {
                    const bucket = row.llm_grid_filters as Record<string, { value?: string | number }> | undefined;
                    const cell = bucket?.[def.id];
                    if (cell?.value === undefined || cell?.value === null) return '';
                    return cell.value;
                },
                renderCell: (params: { value?: unknown }) => (
                    <span className="text-xs text-gray-800 dark:text-gray-100 tabular-nums">{String(params.value ?? '')}</span>
                ),
            })),
        [enabled],
    );
}
