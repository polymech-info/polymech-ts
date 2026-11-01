import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 30,       // 30s — data considered fresh
            gcTime: 1000 * 60 * 5,      // 5 min garbage collection
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
