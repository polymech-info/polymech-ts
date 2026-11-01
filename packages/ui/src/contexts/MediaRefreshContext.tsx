import React, { createContext, useContext, useState, useCallback } from 'react';

interface MediaRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const MediaRefreshContext = createContext<MediaRefreshContextType | undefined>(undefined);

export const MediaRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <MediaRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </MediaRefreshContext.Provider>
  );
};

export const useMediaRefresh = () => {
  const context = useContext(MediaRefreshContext);
  if (context === undefined) {
    throw new Error('useMediaRefresh must be used within a MediaRefreshProvider');
  }
  return context;
};

