import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RefreshContextType {
  registerRefresh: (refreshFn: () => void | Promise<void>) => void;
  unregisterRefresh: () => void;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [refreshFn, setRefreshFn] = useState<(() => void | Promise<void>) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const registerRefresh = useCallback((fn: () => void | Promise<void>) => {
    setRefreshFn(() => fn);
  }, []);

  const unregisterRefresh = useCallback(() => {
    setRefreshFn(null);
  }, []);

  const refresh = useCallback(async () => {
    if (refreshFn) {
      setIsRefreshing(true);
      try {
        await refreshFn();
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [refreshFn]);

  return (
    <RefreshContext.Provider
      value={{
        registerRefresh,
        unregisterRefresh,
        refresh,
        isRefreshing,
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};
