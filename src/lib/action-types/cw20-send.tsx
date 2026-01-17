import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { ActionType } from '../action-registry';

// Type definition for CW20 Send message
export type CW20SendMsg = {
  wasm: {
    execute: {
      contract_addr: string;
      funds: any[];
      msg: { transfer: { recipient: string; amount: string } };
    };
  };
};

// Type guard
const isCW20Send = (data: any): data is CW20SendMsg => {
  return data?.wasm?.execute?.msg?.transfer !== undefined;
};

// Form component
function CW20SendForm({
  data,
  onUpdate,
}: {
  data: CW20SendMsg;
  onUpdate: (path: string[], value: any) => void;
}) {
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

// Export the action type configuration
export const CW20SendActionType: ActionType<CW20SendMsg> = {
  id: 'cw20_send',
  name: 'Send CW20 Tokens',
  icon: Send,
  guard: isCW20Send,
  getTitle: () => 'CW20 Send',
  expandable: false,
  FormEditor: CW20SendForm,
};
