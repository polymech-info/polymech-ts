import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchPlacesGridSearchRunState, RestoredRunState } from '../client-gridsearch';

interface RestoredSearchContextValue {
    /** The loaded run state, null until fetched */
    state: RestoredRunState | null;
    /** True while fetching */
    loading: boolean;
    /** Error message if fetch failed */
    error: string | null;
    /** Whether the run is still active (searching/enriching) — settings should be locked */
    isLocked: boolean;
    /** Whether the run completed */
    isComplete: boolean;
    /** Refetch the state (e.g. after SSE events update data) */
    refetch: () => void;
}

const RestoredSearchContext = createContext<RestoredSearchContextValue>({
    state: null,
    loading: false,
    error: null,
    isLocked: false,
    isComplete: false,
    refetch: () => {},
});

export const useRestoredSearch = () => useContext(RestoredSearchContext);

export function RestoredSearchProvider({
    jobId,
    children,
}: {
    jobId: string | null;
    children: React.ReactNode;
}) {
    const [state, setState] = useState<RestoredRunState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPlacesGridSearchRunState(id);
            setState(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load run state');
            setState(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!jobId) {
            setState(null);
            setError(null);
            return;
        }
        load(jobId);
    }, [jobId, load]);

    const refetch = useCallback(() => {
        if (jobId) load(jobId);
    }, [jobId, load]);

    const status = state?.run?.status || '';
    const isLocked = status === 'searching' || status === 'enriching';
    const isComplete = status === 'complete' || status === 'cancelled';

    return (
        <RestoredSearchContext.Provider
            value={{ state, loading, error, isLocked, isComplete, refetch }}
        >
            {children}
        </RestoredSearchContext.Provider>
    );
}
