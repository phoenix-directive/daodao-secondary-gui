import { WasmExecuteForm } from '@/lib/action-types/wasm-execute/WasmExecuteForm';
import { Code2 } from 'lucide-react';
import { ActionType } from '../../action-registry';
import { WasmExecuteView } from './WasmExecuteView';

// Type definition for Wasm Execute message
export type WasmExecuteMsg = {
  wasm: {
    execute: {
      contract_addr: string;
      funds: any[];
      msg: any;
    };
  };
};

// Type guard - must not be a CW20 transfer
export const isWasmExecute = (data: any): data is WasmExecuteMsg => {
  return data?.wasm?.execute !== undefined && !data.wasm.execute.msg?.transfer;
};

// Helper function to decode message
export function decodeMessage(msg: any): string {
  if (typeof msg === 'string') {
    try {
      const decoded = atob(msg);
      const parsed = JSON.parse(decoded);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return JSON.stringify({}, null, 2);
    }
  }
  return JSON.stringify(msg || {}, null, 2);
}

// Helper function to encode message
export function encodeMessage(jsonText: string): string {
  try {
    const parsed = JSON.parse(jsonText);
    const stringified = JSON.stringify(parsed);
    return btoa(stringified);
  } catch {
    throw new Error('Invalid JSON');
  }
}

// Get subtitle for preview
function getSubtitle(data: WasmExecuteMsg): string {
  let actionName = '';

  try {
    const msg = data.wasm.execute.msg;
    let decodedMsg = msg;

    if (typeof msg === 'string') {
      const decoded = atob(msg);
      decodedMsg = JSON.parse(decoded);
    }

    const firstKey = Object.keys(decodedMsg)[0];
    if (firstKey) {
      actionName = firstKey
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  } catch (e) {
    // Ignore errors
  }

  return actionName;
}

// Export the action type configuration
export const WasmExecuteActionType: ActionType<WasmExecuteMsg> = {
  id: 'wasm_execute',
  name: 'Execute Contract',
  icon: Code2,
  guard: isWasmExecute,
  getTitle: () => 'Execute Smart Contract',
  getSubtitle: getSubtitle,
  expandable: true,
  FormEditor: WasmExecuteForm,
  ViewComponent: WasmExecuteView,
};
