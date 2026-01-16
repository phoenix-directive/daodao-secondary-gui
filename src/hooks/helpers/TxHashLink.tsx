import { Button } from '@/components/ui/button';
import { Chain } from '@/hooks/helpers/assets';
import { useChain } from '@/hooks/useChain';
import { ArrowUpRightIcon } from 'lucide-react';

export const TxHashLink = ({ txhash }: { txhash: string }) => {
  const chain = useChain(Chain.Terra);
  return (
    <Button
      asChild
      variant={'link'}
      size={'sm'}
      className="text-muted-foreground p-0! m-0! h-auto!"
    >
      <a href={chain.linkTx(txhash)} target="_blank">
        {txhash.slice(0, 8)}...{txhash.slice(-8)} <ArrowUpRightIcon />
      </a>
    </Button>
  );
};
