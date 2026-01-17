import { useBalances } from '@/hooks';
import { Balance } from '@/hooks/useBalances';
import { Signal } from '@preact/signals-react';
import { createContext, ReactNode, useContext } from 'react';

interface ProposalFormContextValue {
  balances: {
    data: Signal<Balance[] | null>;
    loading: Signal<boolean>;
    error: Signal<string | null>;
  };
  daoAddress: string;
}

const ProposalFormContext = createContext<ProposalFormContextValue | null>(null);

interface ProposalFormProviderProps {
  daoAddress: string;
  children: ReactNode;
}

export function ProposalFormProvider({ daoAddress, children }: ProposalFormProviderProps) {
  const balances = useBalances(daoAddress);

  return (
    <ProposalFormContext.Provider value={{ balances, daoAddress }}>
      {children}
    </ProposalFormContext.Provider>
  );
}

export function useProposalFormContext() {
  const context = useContext(ProposalFormContext);
  if (!context) {
    throw new Error('useProposalFormContext must be used within ProposalFormProvider');
  }
  return context;
}
