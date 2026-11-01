import { ReactNode } from 'react';
interface OrganizationContextType {
    orgSlug: string | null;
    isOrgContext: boolean;
}
export declare const useOrganization: () => OrganizationContextType;
export declare const OrganizationProvider: ({ children }: {
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export {};
