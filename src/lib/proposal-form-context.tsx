import { useBalances } from '@/hooks';
import { Balance } from '@/hooks/useBalances';
import { usePrices } from '@/hooks/usePrices';
import { Signal, useComputed } from '@preact/signals-react';
import { createContext, ReactNode, useContext } from 'react';

export interface BalanceWithPrice extends Balance {
  usdValue: number;
  formattedAmount: string;
  formattedUsdValue: string;
}

interface ProposalFormContextValue {
  balances: {
    data: Signal<Balance[] | null>;
    loading: Signal<boolean>;
    error: Signal<string | null>;
  };
  daoAddress: string;
  prices: ReturnType<typeof usePrices>;
  allCoins: Signal<BalanceWithPrice[]>;
}

const ProposalFormContext = createContext<ProposalFormContextValue | null>(null);

interface ProposalFormProviderProps {
  daoAddress: string;
  children: ReactNode;
}

export function ProposalFormProvider({ daoAddress, children }: ProposalFormProviderProps) {
  const balances = useBalances(daoAddress);
  const prices = usePrices();

  const allCoins = useComputed(() => {
    const balanceData = balances.data.value || [];

    return balanceData.map((balance): BalanceWithPrice => {
      const amount = parseFloat(balance.amount);
      const priceUsd = parseFloat(balance.priceUsd);
      const decimals = balance.decimals;

      // Calculate USD value
      const usdValue = (amount * priceUsd) / Math.pow(10, decimals);

      // Format amount for display
      const formattedAmount = (amount / Math.pow(10, decimals)).toFixed(decimals);

      // Format USD value
      const formattedUsdValue = `$${usdValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      return {
        ...balance,
        usdValue,
        formattedAmount,
        formattedUsdValue,
      };
    });
  });

  return (
    <ProposalFormContext.Provider value={{ balances, daoAddress, prices, allCoins }}>
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
