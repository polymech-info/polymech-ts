import { useEffect } from 'react';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { useStream } from '@/contexts/StreamContext';

/**
 * Per-item invalidation rules.
 * Each handler receives the entity ID (or null for list-level changes)
 * and the QueryClient. It decides which React Query keys to invalidate.
 */
const INVALIDATION_RULES: Record<string, (id: string | null, qc: QueryClient) => void> = {
    'post': (id, qc) => {
        if (id) qc.invalidateQueries({ queryKey: ['post', id] });
        qc.invalidateQueries({ queryKey: ['posts'] });
        qc.invalidateQueries({ queryKey: ['pages'] });  // posts can embed in pages
        qc.invalidateQueries({ queryKey: ['feed'] });
        qc.invalidateQueries({ queryKey: ['widget-translations'] });
    },
    'posts': (id, qc) => INVALIDATION_RULES['post'](id, qc),
    'picture': (id, qc) => {
        if (id) qc.invalidateQueries({ queryKey: ['picture', id] });
        qc.invalidateQueries({ queryKey: ['pictures'] });
        qc.invalidateQueries({ queryKey: ['posts'] });  // posts depend on pictures
        qc.invalidateQueries({ queryKey: ['pages'] });   // pages depend on pictures
    },
    'pictures': (_id, qc) => {
        // Batch operations (upsert/unlink/delete) — no per-item ID
        qc.invalidateQueries({ queryKey: ['pictures'] });
        qc.invalidateQueries({ queryKey: ['posts'] });
        qc.invalidateQueries({ queryKey: ['pages'] });
        qc.invalidateQueries({ queryKey: ['feed'] });
    },
    'page': (id, qc) => {
        if (id) qc.invalidateQueries({ queryKey: ['page', id] });
        qc.invalidateQueries({ queryKey: ['pages'] });
        qc.invalidateQueries({ queryKey: ['feed'] });
        // Depending on page content, widget translations could update, so invalidate i18n
        qc.invalidateQueries({ queryKey: ['widget-translations'] });
    },
    'pages': (id, qc) => INVALIDATION_RULES['page'](id, qc),
    'category': (_id, qc) => {
        qc.invalidateQueries({ queryKey: ['categories'] });
        qc.invalidateQueries({ queryKey: ['pages'] });   // pages depend on categories
        qc.invalidateQueries({ queryKey: ['feed'] });
        qc.invalidateQueries({ queryKey: ['widget-translations'] });
    },
    'categories': (id, qc) => INVALIDATION_RULES['category'](id, qc),
    'type': (_id, qc) => {
        qc.invalidateQueries({ queryKey: ['types'] });
        qc.invalidateQueries({ queryKey: ['categories'] }); // categories depend on types
        qc.invalidateQueries({ queryKey: ['pages'] });       // → pages
        qc.invalidateQueries({ queryKey: ['widget-translations'] });
    },
    'types': (id, qc) => INVALIDATION_RULES['type'](id, qc),
    'layout': (id, qc) => {
        if (id) qc.invalidateQueries({ queryKey: ['layout', id] });
        qc.invalidateQueries({ queryKey: ['layouts'] });
    },
    'layouts': (id, qc) => INVALIDATION_RULES['layout'](id, qc),
    'glossary': (_id, qc) => {
        qc.invalidateQueries({ queryKey: ['i18n'] });
    },
    'translations': (id, qc) => INVALIDATION_RULES['glossary'](id, qc),
    'i18n': (_id, qc) => {
        qc.invalidateQueries({ queryKey: ['i18n'] });
    },
    'system': (_id, qc) => {
        // System wide flush (often from system widget translations)
        qc.invalidateQueries({ queryKey: ['widget-translations'] });
        qc.invalidateQueries();
    },
};

export const StreamInvalidator = () => {
    const { subscribe } = useStream();
    const queryClient = useQueryClient();

    useEffect(() => {
        const unsubscribe = subscribe((event) => {
            if (event.kind === 'cache' && event.type) {
                const handler = INVALIDATION_RULES[event.type];
                const eventId = event.id ?? event.data?.id ?? null;

                if (handler) {
                    console.log(`[StreamInvalidator] ${event.type}:${eventId ?? '*'}:${event.action}`);
                    handler(eventId, queryClient);
                } else {
                    console.log(`[StreamInvalidator] Unhandled event type: ${event.type}`);
                }
            }
        });

        return unsubscribe;
    }, [subscribe, queryClient]);

    return null;
};
