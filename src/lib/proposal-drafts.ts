/**
 * Utilities for managing proposal drafts in localStorage per DAO
 */

import { UnifiedCosmosMsg } from '@/daodao/types/contracts';

export interface ProposalAction {
  id: string;
  data: UnifiedCosmosMsg; // The actual Cosmos message
}

export interface ProposalChoice {
  id: string;
  title: string;
  description: string;
  actions: ProposalAction[];
}

export interface ProposalDraft {
  title: string;
  description: string;
  proposalType: 'single' | 'multiple';
  // For single choice proposals
  actions: ProposalAction[];
  // For multiple choice proposals
  choices: ProposalChoice[];
  lastModified: number;
}

// Message type detection
export interface MessageTypeInfo {
  type: string;
  name: string;
  icon?: string;
}

export function detectMessageType(data: any): MessageTypeInfo {
  if (!data || typeof data !== 'object') {
    return { type: 'unknown', name: 'Unknown Message' };
  }

  // Stargate messages
  if (data.stargate?.typeUrl) {
    const typeUrl = data.stargate.typeUrl;

    if (typeUrl === '/cosmos.staking.v1beta1.MsgDelegate') {
      return { type: 'staking_delegate', name: 'Delegate Stake' };
    }
    if (typeUrl === '/cosmos.staking.v1beta1.MsgUndelegate') {
      return { type: 'staking_undelegate', name: 'Undelegate Stake' };
    }
    if (typeUrl === '/cosmos.staking.v1beta1.MsgBeginRedelegate') {
      return { type: 'staking_redelegate', name: 'Redelegate Stake' };
    }
    if (typeUrl === '/cosmos.gov.v1beta1.MsgVote' || typeUrl === '/cosmos.gov.v1.MsgVote') {
      return { type: 'gov_vote_stargate', name: 'Vote on Governance (Stargate)' };
    }

    // Generic stargate message
    return { type: 'stargate', name: `Stargate: ${typeUrl.split('.').pop()?.replace('Msg', '')}` };
  }

  // Bank messages
  if (data.bank?.send) {
    return { type: 'bank_send', name: 'Send Tokens' };
  }

  // Governance messages
  if (data.gov?.vote) {
    return { type: 'gov_vote', name: 'Vote on Governance' };
  }

  // CosmWasm messages
  if (data.wasm?.execute) {
    // Check if it's a CW20 transfer
    if (data.wasm.execute.msg?.transfer) {
      return { type: 'cw20_send', name: 'Send CW20 Tokens' };
    }
    return { type: 'wasm_execute', name: 'Execute Contract' };
  }
  if (data.wasm?.instantiate) {
    return { type: 'wasm_instantiate', name: 'Instantiate Contract' };
  }
  if (data.wasm?.migrate) {
    return { type: 'wasm_migrate', name: 'Migrate Contract' };
  }
  if (data.wasm?.update_admin) {
    return { type: 'update_admin', name: 'Update Contract Admin' };
  }

  // Unknown message type
  return { type: 'unknown', name: 'Custom Message' };
}

const DRAFT_KEY_PREFIX = 'proposal_draft_';

export function getDraftKey(daoAddress: string): string {
  return `${DRAFT_KEY_PREFIX}${daoAddress}`;
}

export function saveDraft(daoAddress: string, draft: ProposalDraft): void {
  try {
    const key = getDraftKey(daoAddress);
    const draftWithTimestamp = {
      ...draft,
      lastModified: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(draftWithTimestamp));
  } catch (error) {
    console.error('Failed to save proposal draft:', error);
  }
}

export function loadDraft(daoAddress: string): ProposalDraft | null {
  try {
    const key = getDraftKey(daoAddress);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load proposal draft:', error);
    return null;
  }
}

export function clearDraft(daoAddress: string): void {
  try {
    const key = getDraftKey(daoAddress);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear proposal draft:', error);
  }
}

export function getEmptyDraft(): ProposalDraft {
  return {
    title: '',
    description: '',
    proposalType: 'single',
    actions: [],
    choices: [],
    lastModified: Date.now(),
  };
}
