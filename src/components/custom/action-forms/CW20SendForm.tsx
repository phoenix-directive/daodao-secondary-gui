import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CW20SendFormProps {
  data: {
    wasm: {
      execute: {
        contract_addr: string;
        funds: any[];
        msg: { transfer: { recipient: string; amount: string } };
      };
    };
  };
  onUpdate: (path: string[], value: any) => void;
}

export function CW20SendForm({ data, onUpdate }: CW20SendFormProps) {
  const executeData = data.wasm.execute;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CW20 Contract Address</Label>
        <Input
          value={executeData.contract_addr || ''}
          onChange={(e) => onUpdate(['wasm', 'execute', 'contract_addr'], e.target.value)}
          placeholder="cosmos1..."
        />
      </div>
      <div className="space-y-2">
        <Label>Recipient</Label>
        <Input
          value={executeData.msg.transfer.recipient || ''}
          onChange={(e) =>
            onUpdate(['wasm', 'execute', 'msg', 'transfer', 'recipient'], e.target.value)
          }
          placeholder="cosmos1..."
        />
      </div>
      <div className="space-y-2">
        <Label>Amount</Label>
        <Input
          value={executeData.msg.transfer.amount || ''}
          onChange={(e) =>
            onUpdate(['wasm', 'execute', 'msg', 'transfer', 'amount'], e.target.value)
          }
          placeholder="1000000"
        />
      </div>
    </div>
  );
}
