import { createContext, ReactNode, useContext } from 'react';

interface ChainProviderContextValue {
  chainId: string;
}

const ChainProviderContext = createContext<ChainProviderContextValue | null>(null);

interface ChainProviderProps {
  chainId: string;
  children: ReactNode;
}

export function ChainProvider({ chainId, children }: ChainProviderProps) {
  return (
    <ChainProviderContext.Provider value={{ chainId }}>{children}</ChainProviderContext.Provider>
  );
}

export function useChainProvider() {
  const context = useContext(ChainProviderContext);
  if (!context) {
    throw new Error('useChainProvider must be used within a ChainProvider');
  }
  return context;
}
