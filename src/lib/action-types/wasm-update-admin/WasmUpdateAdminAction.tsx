import { UserCog } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { WasmUpdateAdminForm } from './WasmUpdateAdminForm';

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
export const isWasmUpdateAdmin = (data: any): data is WasmUpdateAdminMsg => {
  return data?.wasm?.update_admin !== undefined;
};

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
