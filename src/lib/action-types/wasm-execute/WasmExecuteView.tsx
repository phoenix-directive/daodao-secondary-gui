import { AddressLink } from '@/components/ui/address-link';
import { AmountDisplay } from '@/components/ui/amount-display';
import { JsonViewer } from '@/components/ui/json-viewer';
import { usePrices } from '@/hooks/usePrices';
import type { WasmExecuteMsg } from './WasmExecuteAction';

export function WasmExecuteView({ data }: { data: WasmExecuteMsg }) {
  const { contract_addr, msg, funds } = data.wasm.execute;
  const { getPrice } = usePrices();

  // Decode base64 message if needed
  let decodedMsg = msg;
  if (typeof msg === 'string') {
    try {
      const decoded = atob(msg);
      decodedMsg = JSON.parse(decoded);
    } catch (e) {
      decodedMsg = { error: 'Failed to decode message', raw: msg };
    }
  }

  // Check if this is an increase_allowance message
  const isIncreaseAllowance = decodedMsg.increase_allowance;
  const tokenInfo = isIncreaseAllowance ? getPrice(contract_addr) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Contract</div>
          {tokenInfo ? (
            <div className="flex items-center gap-2">
              <AddressLink address={contract_addr} short={true} isSmartContract={true} />
              <span className="text-sm text-muted-foreground">({tokenInfo.display})</span>
            </div>
          ) : (
            <AddressLink address={contract_addr} short={true} isSmartContract={true} />
          )}
        </div>

        {isIncreaseAllowance && decodedMsg.increase_allowance.amount && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Allowed Funds</div>
            <div className="space-y-2">
              <AmountDisplay amount={decodedMsg.increase_allowance.amount} denom={contract_addr} />
            </div>
          </div>
        )}

        {funds && funds.length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Funds</div>
            <div className="space-y-2">
              {funds.map((fund: any, idx: number) => (
                <AmountDisplay key={idx} amount={fund.amount} denom={fund.denom} />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Message</div>
          <div className="overflow-hidden rounded-lg border">
            <JsonViewer data={decodedMsg} />
          </div>
        </div>
      </div>
    </div>
  );
}
