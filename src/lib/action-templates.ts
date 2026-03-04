import ecosystemProjects from '@/config/ecosystemProjects.json';
import { encodeProtobufValue } from '@/daodao/protobuf/utils';
import {
  ArrowRightLeft,
  Coins,
  Coins as CoinsIcon,
  ExternalLink,
  FileText,
  Flame,
  LucideIcon,
  Send,
  Settings,
  Wallet,
} from 'lucide-react';

// Helper to convert Uint8Array to base64
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

// Helper to create encoded stargate message
function createStargateTemplate(typeUrl: string, value: any) {
  const encodedBytes = encodeProtobufValue(typeUrl, value);
  return {
    stargate: {
      type_url: typeUrl,
      value: toBase64(encodedBytes),
    },
  };
}

export enum ActionCategory {
  TREASURY = 'treasury',
  GOVERNANCE = 'governance',
  CUSTOM = 'custom',
  APPS = 'apps',
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

const BASE_ACTION_TEMPLATES: ActionTemplate[] = [
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
    id: 'bank_burn',
    name: 'Burn Tokens',
    title: 'Burn Tokens',
    description: 'Burn native tokens from the treasury',
    icon: Flame,
    category: ActionCategory.TREASURY,
    defaultData: {
      bank: {
        burn: {
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
    id: 'cw20_transfer',
    name: 'Transfer CW20',
    title: 'Transfer CW20',
    description: 'Transfer CW20 tokens to an address',
    icon: ArrowRightLeft,
    category: ActionCategory.TREASURY,
    defaultData: {
      wasm: {
        execute: {
          contract_addr: '',
          funds: [],
          msg: btoa(
            JSON.stringify({
              transfer: {
                recipient: '',
                amount: '0',
              },
            }),
          ),
        },
      },
    },
  },
  {
    id: 'cw20_send',
    name: 'Send CW20',
    title: 'Send CW20',
    description: 'Send CW20 tokens to a contract with a message',
    icon: CoinsIcon,
    category: ActionCategory.TREASURY,
    defaultData: {
      wasm: {
        execute: {
          contract_addr: '',
          funds: [],
          msg: btoa(
            JSON.stringify({
              send: {
                contract: '',
                amount: '0',
                msg: '',
              },
            }),
          ),
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
    defaultData: createStargateTemplate('/cosmos.staking.v1beta1.MsgDelegate', {
      delegatorAddress: '',
      validatorAddress: '',
      amount: {
        denom: 'uluna',
        amount: '0',
      },
    }),
  },
  {
    id: 'staking_undelegate',
    name: 'Undelegate Stake',
    title: 'Undelegate Stake',
    description: 'Undelegate tokens from a validator',
    icon: ArrowRightLeft,
    category: ActionCategory.GOVERNANCE,
    defaultData: createStargateTemplate('/cosmos.staking.v1beta1.MsgUndelegate', {
      delegatorAddress: '',
      validatorAddress: '',
      amount: {
        denom: 'uluna',
        amount: '0',
      },
    }),
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

// Generate app templates from ecosystem projects
const appTemplates: ActionTemplate[] = (ecosystemProjects as any[])
  .filter(
    (project) =>
      project.app === true && project.link && !project.name.toLowerCase().includes('local'),
  )
  .map((project) => ({
    id: `app_${project.name.toLowerCase().replace(/\s+/g, '_')}`,
    name: project.name,
    title: project.name,
    description: project.description || 'Open app in fullscreen',
    icon: ExternalLink,
    category: ActionCategory.APPS,
    defaultData: {
      app: {
        url: project.link,
        name: project.name,
      },
    },
  }));

// Combine base templates with generated app templates
export const ACTION_TEMPLATES = [...BASE_ACTION_TEMPLATES, ...appTemplates];

export function getTemplateById(id: string): ActionTemplate | undefined {
  return ACTION_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: ActionCategory): ActionTemplate[] {
  return ACTION_TEMPLATES.filter((t) => t.category === category);
}
