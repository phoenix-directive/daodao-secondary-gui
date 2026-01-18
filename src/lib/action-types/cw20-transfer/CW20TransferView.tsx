import { AddressLink } from '@/components/ui/address-link';
import { AmountDisplay } from '@/components/ui/amount-display';
import { usePrices } from '@/hooks/usePrices';
import type { CW20TransferMsg, TransferMessage } from './CW20TransferAction';

export function CW20TransferView({ data }: { data: CW20TransferMsg }) {
  const { contract_addr, msg } = data.wasm.execute;
  const { getPrice } = usePrices();

  // Decode message
  let decodedMsg: TransferMessage | null = null;
  try {
    decodedMsg = JSON.parse(atob(msg));
  } catch (e) {
    console.error('Failed to decode message:', e);
  }

  const tokenInfo = getPrice(contract_addr);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Token Contract</div>
          {tokenInfo ? (
            <div className="flex items-center gap-2">
              <AddressLink address={contract_addr} short={false} />
              <span className="text-sm text-muted-foreground">({tokenInfo.display})</span>
            </div>
          ) : (
            <AddressLink address={contract_addr} short={false} />
          )}
        </div>

        {decodedMsg?.transfer?.amount && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Amount</div>
            <AmountDisplay amount={decodedMsg.transfer.amount} denom={contract_addr} />
          </div>
        )}

        {decodedMsg?.transfer?.recipient && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Recipient</div>
            <AddressLink address={decodedMsg.transfer.recipient} short={false} />
          </div>
        )}
      </div>
    </div>
  );
}
