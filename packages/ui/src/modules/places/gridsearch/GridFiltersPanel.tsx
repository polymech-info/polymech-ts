import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getAuthToken } from '@/lib/db';
import {
    fetchCompetitorById,
    getPlacesAiGridFilters,
    postLlmFiltersRun,
    getLlmFiltersStreamUrl,
    savePlacesAiGridFilters,
    type PlacesAiGridFilterDef,
} from '../client-gridsearch';
import type { CompetitorsGridViewHandle } from '../PlacesGridView';
import { T, translate } from '@/i18n';

function newFilter(): PlacesAiGridFilterDef {
    return {
        id: crypto.randomUUID(),
        label: '',
        prompt: '',
        targetField: `ai_${crypto.randomUUID().slice(0, 8)}`,
        enabled: true,
        valueType: 'auto',
    };
}

type GridFiltersPanelProps = {
    gridExportRef: React.RefObject<CompetitorsGridViewHandle | null>;
    getPlaceIdsAll: () => string[];
    onPlaceLlmUpdated: (placeId: string) => void;
    /** When false (e.g. public viewer), hide run + editor. */
    canEdit: boolean;
    /** After definitions are saved to secrets, parent can refresh column defs. */
    onFiltersPersisted?: () => void;
};

export const GridFiltersPanel: React.FC<GridFiltersPanelProps> = ({
    gridExportRef,
    getPlaceIdsAll,
    onPlaceLlmUpdated,
    canEdit,
    onFiltersPersisted,
}) => {
    const [defs, setDefs] = useState<PlacesAiGridFilterDef[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [runStatus, setRunStatus] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const d = await getPlacesAiGridFilters();
                if (!cancelled) setDefs(d);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const persistDefs = useCallback(
        async (next: PlacesAiGridFilterDef[]) => {
            setSaving(true);
            try {
                await savePlacesAiGridFilters(next);
                setDefs(next);
                onFiltersPersisted?.();
            } catch (e) {
                console.error(e);
                setRunStatus(String((e as Error)?.message || e));
            } finally {
                setSaving(false);
            }
        },
        [onFiltersPersisted],
    );

    const addFilter = () => {
        void persistDefs([...defs, newFilter()]);
    };

    const removeFilter = (id: string) => {
        void persistDefs(defs.filter((d) => d.id !== id));
    };

    const patchFilter = (id: string, patch: Partial<PlacesAiGridFilterDef>) => {
        setDefs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    };

    const saveDraft = () => {
        void persistDefs(defs);
    };

    const enabledFilterIds = defs.filter((d) => d.enabled !== false).map((d) => d.id);

    const runBatch = async (placeIds: string[]) => {
        if (!canEdit || placeIds.length === 0 || enabledFilterIds.length === 0) return;
        setRunning(true);
        setRunStatus(null);
        let es: EventSource | null = null;
        try {
            const { runId } = await postLlmFiltersRun({
                placeIds,
                filterIds: enabledFilterIds,
                lang: typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : undefined,
            });
            const token = await getAuthToken();
            const url = getLlmFiltersStreamUrl(runId, token);
            es = new EventSource(url);

            es.addEventListener('message', (ev: MessageEvent) => {
                try {
                    const p = JSON.parse(ev.data) as {
                        kind?: string;
                        placeId?: string;
                        filterId?: string;
                        error?: string;
                    };
                    if (p.kind === 'cell' && p.placeId) {
                        onPlaceLlmUpdated(p.placeId);
                    }
                    if (p.kind === 'error') {
                        setRunStatus(p.error || 'Error');
                    }
                } catch {
                    /* ignore */
                }
            });

            es.addEventListener('complete', () => {
                setRunStatus(translate('AI filters run finished'));
                es?.close();
                es = null;
                setRunning(false);
            });

            es.onerror = () => {
                setRunning(false);
                es?.close();
                es = null;
            };
        } catch (e) {
            console.error(e);
            setRunStatus(String((e as Error)?.message || e));
            setRunning(false);
            es?.close();
        }
    };

    const handleRunAll = () => {
        void runBatch(getPlaceIdsAll());
    };

    const handleRunSelected = () => {
        const api = gridExportRef.current;
        const selected = api?.getSelectedPlaceIds?.() ?? [];
        const ids = selected.length > 0 ? selected : getPlaceIdsAll();
        void runBatch(ids);
    };

    if (!canEdit) {
        return (
            <p className="text-xs text-amber-800 dark:text-amber-200">
                <T>AI grid filters are available to the search owner.</T>
            </p>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <T>Loading filters…</T>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    disabled={running || saving}
                    onClick={addFilter}
                    className="text-xs px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800"
                >
                    + <T>Add AI filter</T>
                </button>
                <button
                    type="button"
                    disabled={running || saving}
                    onClick={saveDraft}
                    className="text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600"
                >
                    <T>Save filter definitions</T>
                </button>
                <button
                    type="button"
                    disabled={running || enabledFilterIds.length === 0}
                    onClick={handleRunSelected}
                    className="text-xs px-2 py-1 rounded-md bg-violet-600 text-white disabled:opacity-50"
                >
                    {running ? <Loader2 className="h-3 w-3 animate-spin inline" /> : null}{' '}
                    <T>Run AI filters (selection or all)</T>
                </button>
                <button
                    type="button"
                    disabled={running || enabledFilterIds.length === 0}
                    onClick={handleRunAll}
                    className="text-xs px-2 py-1 rounded-md border border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200"
                >
                    <T>Run on all rows</T>
                </button>
            </div>

            {runStatus && <p className="text-[11px] text-gray-600 dark:text-gray-400">{runStatus}</p>}

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {defs.map((d) => (
                    <div
                        key={d.id}
                        className="rounded-md border border-amber-200/80 dark:border-amber-900/50 bg-white/80 dark:bg-gray-900/40 p-2 space-y-1.5"
                    >
                        <div className="flex items-center gap-2 flex-wrap">
                            <label className="flex items-center gap-1 text-[10px]">
                                <input
                                    type="checkbox"
                                    checked={d.enabled !== false}
                                    onChange={(e) => patchFilter(d.id, { enabled: e.target.checked })}
                                />
                                <T>On</T>
                            </label>
                            <input
                                className="text-xs flex-1 min-w-[120px] border rounded px-1 py-0.5 dark:bg-gray-900"
                                value={d.label}
                                onChange={(e) => patchFilter(d.id, { label: e.target.value })}
                                placeholder={translate('Label')}
                            />
                            <input
                                className="text-xs w-36 font-mono border rounded px-1 py-0.5 dark:bg-gray-900"
                                value={d.targetField}
                                onChange={(e) =>
                                    patchFilter(d.id, {
                                        targetField: e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
                                    })
                                }
                                placeholder="ai_field"
                            />
                            <select
                                className="text-[10px] border rounded px-1 py-0.5 dark:bg-gray-900 max-w-[7rem]"
                                value={d.valueType ?? 'auto'}
                                title={translate('Cell value type (for sorting / filters)')}
                                onChange={(e) =>
                                    patchFilter(d.id, {
                                        valueType: e.target.value as 'auto' | 'number' | 'string',
                                    })
                                }
                            >
                                <option value="auto">{translate('Auto')}</option>
                                <option value="number">{translate('Number')}</option>
                                <option value="string">{translate('String')}</option>
                            </select>
                            <button
                                type="button"
                                className="text-[10px] text-red-600 dark:text-red-400"
                                onClick={() => removeFilter(d.id)}
                            >
                                <T>Remove</T>
                            </button>
                        </div>
                        <textarea
                            className="w-full text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                            rows={2}
                            value={d.prompt}
                            onChange={(e) => patchFilter(d.id, { prompt: e.target.value })}
                            placeholder={translate('Instructions for the model (what to score or extract)')}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
