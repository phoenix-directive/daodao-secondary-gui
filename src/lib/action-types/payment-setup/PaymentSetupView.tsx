import { AddressLink } from '@/components/ui/address-link';
import { AmountDisplay } from '@/components/ui/amount-display';
import { Button } from '@/components/ui/button';
import { fromBaseUnits } from '@/hooks/useBalances';
import { usePrices } from '@/hooks/usePrices';
import { WasmExecuteView } from '@/lib/action-types/wasm-execute/WasmExecuteView';
import { Clock, Code2 } from 'lucide-react';
import { useState } from 'react';
import type { PaymentSetupMsg } from './PaymentSetupAction';

export function PaymentSetupView({ data }: { data: PaymentSetupMsg }) {
  const [showRawView, setShowRawView] = useState(false);
  const { getPrice } = usePrices();

  // If showing raw view, delegate to WasmExecuteView
  if (showRawView) {
    return (
      <div className="space-y-3">
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRawView(false)}
            className="text-xs"
          >
            Show Payment View
          </Button>
        </div>
        <WasmExecuteView data={data} />
      </div>
    );
  }

  // Decode base64 message if needed
  let msg = data.wasm.execute.msg;
  if (typeof msg === 'string') {
    try {
      const decoded = atob(msg);
      msg = JSON.parse(decoded);
    } catch (e) {
      // If decoding fails, fall back to raw view
      return <WasmExecuteView data={data} />;
    }
  }

  const { name, action } = msg.setup;
  const { payments } = action.payment;

  // Calculate total amount (assumes all payments use the same token)
  const totalAmount = payments.reduce((sum, payment) => {
    return sum + BigInt(payment.asset.amount);
  }, BigInt(0));

  const firstPayment = payments[0];
  const denom = firstPayment.asset.info.native || firstPayment.asset.info.cw20 || '';
  const tokenInfo = getPrice(denom);

  // Format timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-start">
        <Button variant="ghost" size="sm" onClick={() => setShowRawView(true)} className="text-xs">
          <Code2 className="mr-1.5 h-3 w-3" />
          Show Contract Message
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Total Amount</div>
          <AmountDisplay amount={totalAmount.toString()} denom={denom} />
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Payments ({payments.length})
          </div>
          <div className="space-y-3">
            {payments.map((payment, idx) => (
              <div key={idx} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Recipient</div>
                    <AddressLink address={payment.recipient} short={true} allowTagging={true} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Amount</div>
                    <div className="font-medium">
                      {fromBaseUnits(payment.asset.amount, tokenInfo?.decimals || 6)}{' '}
                      {tokenInfo?.display || 'tokens'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {payment.claimable_after_s
                      ? `Claimable after ${formatDate(payment.claimable_after_s)}`
                      : 'Immediately claimable'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
