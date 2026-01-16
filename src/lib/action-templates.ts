import {
  ArrowRightLeft,
  Coins,
  Coins as CoinsIcon,
  FileText,
  LucideIcon,
  Send,
  Settings,
  Wallet,
} from 'lucide-react';

export enum ActionCategory {
  TREASURY = 'treasury',
  GOVERNANCE = 'governance',
  CUSTOM = 'custom',
}

export interface ActionTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: ActionCategory;
  defaultData: any;
}

export const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: 'bank_send',
    name: 'Send Tokens',
    title: 'Send Tokens',
    description: 'Transfer native tokens to an address',
    icon: Send,
    category: ActionCategory.TREASURY,
    defaultData: {
      bank: {
        send: {
          to_address: '',
          amount: [
            {
              denom: 'uluna',
              amount: '0',
            },
          ],
        },
      },
    },
  },
  {
    id: 'cw20_send',
    name: 'Send CW20 Tokens',
    title: 'Send CW20 Tokens',
    description: 'Transfer CW20 tokens to an address',
    icon: CoinsIcon,
    category: ActionCategory.TREASURY,
    defaultData: {
      wasm: {
        execute: {
          contract_addr: '',
          funds: [],
          msg: {
            transfer: {
              recipient: '',
              amount: '0',
            },
          },
        },
      },
    },
  },
  {
    id: 'wasm_execute',
    name: 'Execute Contract',
    title: 'Execute Contract',
    description: 'Execute a smart contract message',
    icon: FileText,
    category: ActionCategory.CUSTOM,
    defaultData: {
      wasm: {
        execute: {
          contract_addr: '',
          funds: [],
          msg: {},
        },
      },
    },
  },
  {
    id: 'staking_delegate',
    name: 'Delegate Stake',
    title: 'Delegate Stake',
    description: 'Delegate tokens to a validator',
    icon: Coins,
    category: ActionCategory.GOVERNANCE,
    defaultData: {
      stargate: {
        typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
        value: {
          delegatorAddress: '',
          validatorAddress: '',
          amount: {
            denom: 'uluna',
            amount: '0',
          },
        },
      },
    },
  },
  {
    id: 'staking_undelegate',
    name: 'Undelegate Stake',
    title: 'Undelegate Stake',
    description: 'Undelegate tokens from a validator',
    icon: ArrowRightLeft,
    category: ActionCategory.GOVERNANCE,
    defaultData: {
      stargate: {
        typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
        value: {
          delegatorAddress: '',
          validatorAddress: '',
          amount: {
            denom: 'uluna',
            amount: '0',
          },
        },
      },
    },
  },
  {
    id: 'gov_vote',
    name: 'Vote on Governance',
    title: 'Vote on Governance Proposal',
    description: 'Vote on a chain governance proposal',
    icon: Settings,
    category: ActionCategory.GOVERNANCE,
    defaultData: {
      gov: {
        vote: {
          proposal_id: 0,
          vote: 'yes',
        },
      },
    },
  },
  {
    id: 'update_admin',
    name: 'Update Contract Admin',
    title: 'Update Contract Admin',
    description: 'Change the admin of a contract',
    icon: Wallet,
    category: ActionCategory.GOVERNANCE,
    defaultData: {
      wasm: {
        update_admin: {
          contract_addr: '',
          admin: '',
        },
      },
    },
  },
];

export function getTemplateById(id: string): ActionTemplate | undefined {
  return ACTION_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: ActionCategory): ActionTemplate[] {
  return ACTION_TEMPLATES.filter((t) => t.category === category);
}
