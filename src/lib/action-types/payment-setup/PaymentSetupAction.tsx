import { fromBaseUnits } from '@/hooks/useBalances';
import { PaymentSetupView } from '@/lib/action-types/payment-setup/PaymentSetupView';
import { WasmExecuteForm } from '@/lib/action-types/wasm-execute/WasmExecuteForm';
import { Wallet } from 'lucide-react';
import { ActionType } from '../../action-registry';

// Type definition for Payment Setup message
export type PaymentSetupMsg = {
  wasm: {
    execute: {
      contract_addr: string;
      funds: any[];
      msg: {
        setup: {
          name: string;
          action: {
            payment: {
              payments: Array<{
                asset: {
                  amount: string;
                  info: {
                    native?: string;
                    cw20?: string;
                  };
                };
                recipient: string;
                claimable_after_s: number;
              }>;
            };
          };
        };
      };
    };
  };
};

// Type guard for payment setup messages
export const isPaymentSetup = (data: any): data is PaymentSetupMsg => {
  try {
    if (!data?.wasm?.execute?.msg) return false;

    let msg = data.wasm.execute.msg;

    // Decode base64 if needed
    if (typeof msg === 'string') {
      const decoded = atob(msg);
      msg = JSON.parse(decoded);
    }

    const result =
      msg?.setup?.action?.payment?.payments !== undefined &&
      Array.isArray(msg.setup.action.payment.payments);

    return result;
  } catch (e) {
    return false;
  }
};

// Get subtitle showing payment count and total
function getSubtitle(data: PaymentSetupMsg): string {
  try {
    let msg = data.wasm.execute.msg;

    // Decode base64 if needed
    if (typeof msg === 'string') {
      const decoded = atob(msg);
      msg = JSON.parse(decoded);
    }

    return msg.setup.name;
  } catch (e) {
    return 'Payment Schedule';
  }
}

// Export the action type configuration
export const PaymentSetupActionType: ActionType<PaymentSetupMsg> = {
  id: 'payment_setup',
  name: 'Payment Schedule',
  icon: Wallet,
  guard: isPaymentSetup,
  getTitle: () => 'Payment',
  getSubtitle: getSubtitle,
  expandable: true,
  FormEditor: WasmExecuteForm, // Reuse wasm execute form for editing
  ViewComponent: PaymentSetupView,
};
