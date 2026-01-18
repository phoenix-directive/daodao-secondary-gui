import { AddressLink } from '@/components/ui/address-link';
import { AmountDisplay } from '@/components/ui/amount-display';
import { JsonViewer } from '@/components/ui/json-viewer';
import { usePrices } from '@/hooks/usePrices';
import type { CW20SendMsg, SendMessage } from './CW20SendAction';

export function CW20SendView({ data }: { data: CW20SendMsg }) {
  const { contract_addr, msg } = data.wasm.execute;
  const { getPrice } = usePrices();

  // Decode outer message
  let decodedMsg: SendMessage | null = null;
  try {
    decodedMsg = JSON.parse(atob(msg));
  } catch (e) {
    console.error('Failed to decode message:', e);
  }

  // Decode inner message
  let innerMsg: any = {};
  if (decodedMsg?.send?.msg) {
    try {
      innerMsg = JSON.parse(atob(decodedMsg.send.msg));
    } catch (e) {
      innerMsg = { error: 'Failed to decode inner message', raw: decodedMsg.send.msg };
    }
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

        {decodedMsg?.send?.amount && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Amount</div>
            <AmountDisplay amount={decodedMsg.send.amount} denom={contract_addr} />
          </div>
        )}

        {decodedMsg?.send?.contract && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Recipient Contract</div>
            <AddressLink address={decodedMsg.send.contract} short={false} />
          </div>
        )}

        {innerMsg && Object.keys(innerMsg).length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Message</div>
            <div className="overflow-hidden rounded-lg border">
              <JsonViewer data={innerMsg} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
