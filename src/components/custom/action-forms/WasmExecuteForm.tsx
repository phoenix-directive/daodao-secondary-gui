import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface WasmExecuteFormProps {
  data: {
    wasm: {
      execute: {
        contract_addr: string;
        funds: any[];
        msg: any;
      };
    };
  };
  onUpdate: (path: string[], value: any) => void;
}

export function WasmExecuteForm({ data, onUpdate }: WasmExecuteFormProps) {
  const executeData = data.wasm.execute;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Contract Address</Label>
        <Input
          value={executeData.contract_addr || ''}
          onChange={(e) => onUpdate(['wasm', 'execute', 'contract_addr'], e.target.value)}
          placeholder="cosmos1..."
        />
      </div>
      <div className="space-y-2">
        <Label>Execute Message (JSON)</Label>
        <Textarea
          value={JSON.stringify(executeData.msg || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onUpdate(['wasm', 'execute', 'msg'], parsed);
            } catch {}
          }}
          className="font-mono text-xs min-h-[150px]"
          placeholder='{"method": "value"}'
        />
      </div>
    </div>
  );
}
