/**
 * Utilities for managing proposal drafts in localStorage per DAO
 */

export interface ProposalAction {
  id: string;
  type: string;
  data: any;
}

export interface ProposalDraft {
  title: string;
  description: string;
  proposalType: 'single' | 'multiple';
  actions: ProposalAction[];
  lastModified: number;
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
    lastModified: Date.now(),
  };
}
