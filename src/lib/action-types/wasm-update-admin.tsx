import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCog } from 'lucide-react';
import { ActionType } from '../action-registry';

// Type definition for Wasm Update Admin message
export type WasmUpdateAdminMsg = {
  wasm: {
    update_admin: {
      contract_addr: string;
      admin: string;
    };
  };
};

// Type guard
const isWasmUpdateAdmin = (data: any): data is WasmUpdateAdminMsg => {
  return data?.wasm?.update_admin !== undefined;
};

// Form component
function WasmUpdateAdminForm({
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

// Export the action type configuration
export const WasmUpdateAdminActionType: ActionType<WasmUpdateAdminMsg> = {
  id: 'update_admin',
  name: 'Update Contract Admin',
  icon: UserCog,
  guard: isWasmUpdateAdmin,
  getTitle: () => 'Update Contract Admin',
  expandable: false,
  FormEditor: WasmUpdateAdminForm,
};
