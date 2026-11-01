import { useQuery } from '@tanstack/react-query';
import type { AppConfig } from '../../shared/src/config/config';
import { apiClient, serverUrl } from '@/lib/db.js';

interface SystemInfo {
    env: Record<string, string> & { appConfig?: AppConfig };
    /** Product names with `enabled: true` in server config/products.json */
    enabledProducts: string[];
}

export const useSystemInfo = () => {
    return useQuery<SystemInfo>({
        queryKey: ['system-info'],
        queryFn: () => apiClient<SystemInfo>('/api/system-info'),
        staleTime: Infinity,
        gcTime: Infinity,
    });
};

/** Shorthand: get a specific env variable */
export const useEnvVar = (key: string): string | undefined => {
    const { data } = useSystemInfo();
    return data?.env[key];
};

/** Shorthand: get the app config */
export const useAppConfig = (): AppConfig | undefined => {
    const { data } = useSystemInfo();
    return data?.env as unknown as AppConfig;
};

/** Shorthand: product names enabled in server config/products.json */
export const useEnabledProducts = (): string[] | undefined => {
    const { data } = useSystemInfo();
    return data?.enabledProducts;
};
