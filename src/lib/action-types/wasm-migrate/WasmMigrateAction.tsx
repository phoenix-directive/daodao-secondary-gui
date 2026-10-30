import { ArrowUpCircle } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { WasmMigrateForm } from './WasmMigrateForm';
import { WasmMigrateView } from './WasmMigrateView';

// Type definition for Wasm Migrate message
export type WasmMigrateMsg = {
  wasm: {
    migrate: {
      contract_addr: string;
      new_code_id: number;
      msg: any;
    };
  };
};

// Type guard
export const isWasmMigrate = (data: any): data is WasmMigrateMsg => {
  return data?.wasm?.migrate !== undefined;
};

// Export the action type configuration
export const WasmMigrateActionType: ActionType<WasmMigrateMsg> = {
  id: 'wasm_migrate',
  name: 'Migrate Contract',
  icon: ArrowUpCircle,
  guard: isWasmMigrate,
  getTitle: () => 'Migrate Contract',
  getSubtitle: (data) =>
    data.wasm.migrate.new_code_id ? `Code ID ${data.wasm.migrate.new_code_id}` : '',
  expandable: true,
  FormEditor: WasmMigrateForm,
  ViewComponent: WasmMigrateView,
};
