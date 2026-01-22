/**
 * TxButtonContent - Reusable button content that displays transaction states
 * Shows different content based on simulation/publishing loading states
 */

import { Loader2 } from 'lucide-react';

interface TxButtonContentProps {
  tx: {
    simulation: { loading?: boolean | undefined };
    result: { loading?: boolean | undefined };
  };
  children: React.ReactNode;
}

export function TxButtonContent({ tx, children }: TxButtonContentProps) {
  if (tx.simulation.loading) {
    return (
      <>
        <Loader2 className="-ml-4 mr-1 h-4 w-4 animate-spin" />
        Simulating...
      </>
    );
  }

  if (tx.result.loading) {
    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Publishing...
      </>
    );
  }

  return <>{children}</>;
}
