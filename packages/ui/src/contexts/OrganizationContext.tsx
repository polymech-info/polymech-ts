import { createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface OrganizationContextType {
  orgSlug: string | null;
  isOrgContext: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  orgSlug: null,
  isOrgContext: false,
});

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  return context;
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  
  // Parse orgSlug from pathname like /org/:orgSlug/...
  const orgSlugMatch = location.pathname.match(/^\/org\/([^\/]+)/);
  const orgSlug = orgSlugMatch ? orgSlugMatch[1] : null;
  
  return (
    <OrganizationContext.Provider
      value={{
        orgSlug,
        isOrgContext: !!orgSlug,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
