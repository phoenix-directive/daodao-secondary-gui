import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WasmUpdateAdminMsg } from './WasmUpdateAdminAction';

export function WasmUpdateAdminForm({
  data,
  onUpdate,
}: {
  data: WasmUpdateAdminMsg;
  onUpdate: (path: string[], value: any) => void;
}) {
  const updateAdminData = data.wasm.update_admin;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Contract Address</Label>
        <Input
          value={updateAdminData.contract_addr || ''}
          onChange={(e) => onUpdate(['wasm', 'update_admin', 'contract_addr'], e.target.value)}
          placeholder="cosmos1..."
        />
      </div>
      <div className="space-y-2">
        <Label>New Admin</Label>
        <Input
          value={updateAdminData.admin || ''}
          onChange={(e) => onUpdate(['wasm', 'update_admin', 'admin'], e.target.value)}
          placeholder="cosmos1..."
        />
      </div>
    </div>
  );
}
