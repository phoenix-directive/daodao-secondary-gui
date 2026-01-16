import { ArrowRightLeft, Coins, FileText, LucideIcon, Send, Settings, Wallet } from 'lucide-react';

export interface ActionTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: 'treasury' | 'governance' | 'custom';
  defaultData: any;
}

export const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: 'bank_send',
    name: 'Send Tokens',
    title: 'Send Tokens',
    description: 'Transfer native tokens to an address',
    icon: Send,
    category: 'treasury',
    defaultData: {
      '@type': '/cosmos.bank.v1beta1.MsgSend',
      from_address: '',
      to_address: '',
      amount: [
        {
          denom: 'uluna',
          amount: '0',
        },
      ],
    },
  },
  {
    id: 'wasm_execute',
    name: 'Execute Contract',
    title: 'Execute Contract',
    description: 'Execute a smart contract message',
    icon: FileText,
    category: 'custom',
    defaultData: {
      '@type': '/cosmwasm.wasm.v1.MsgExecuteContract',
      sender: '',
      contract: '',
      msg: {},
      funds: [],
    },
  },
  {
    id: 'staking_delegate',
    name: 'Delegate Stake',
    title: 'Delegate Stake',
    description: 'Delegate tokens to a validator',
    icon: Coins,
    category: 'governance',
    defaultData: {
      '@type': '/cosmos.staking.v1beta1.MsgDelegate',
      delegator_address: '',
      validator_address: '',
      amount: {
        denom: 'uluna',
        amount: '0',
      },
    },
  },
  {
    id: 'staking_undelegate',
    name: 'Undelegate Stake',
    title: 'Undelegate Stake',
    description: 'Undelegate tokens from a validator',
    icon: ArrowRightLeft,
    category: 'governance',
    defaultData: {
      '@type': '/cosmos.staking.v1beta1.MsgUndelegate',
      delegator_address: '',
      validator_address: '',
      amount: {
        denom: 'uluna',
        amount: '0',
      },
    },
  },
  {
    id: 'gov_vote',
    name: 'Vote on Governance',
    title: 'Vote on Governance Proposal',
    description: 'Vote on a chain governance proposal',
    icon: Settings,
    category: 'governance',
    defaultData: {
      '@type': '/cosmos.gov.v1beta1.MsgVote',
      proposal_id: '',
      voter: '',
      option: 'VOTE_OPTION_YES',
    },
  },
  {
    id: 'update_admin',
    name: 'Update Contract Admin',
    title: 'Update Contract Admin',
    description: 'Change the admin of a contract',
    icon: Wallet,
    category: 'governance',
    defaultData: {
      '@type': '/cosmwasm.wasm.v1.MsgUpdateAdmin',
      sender: '',
      new_admin: '',
      contract: '',
    },
  },
];

export function getTemplateById(id: string): ActionTemplate | undefined {
  return ACTION_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: 'treasury' | 'governance' | 'custom',
): ActionTemplate[] {
  return ACTION_TEMPLATES.filter((t) => t.category === category);
}
