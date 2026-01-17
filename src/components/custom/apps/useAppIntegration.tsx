import { ProposalAction } from '@/lib/proposal-drafts';
import { useCallback, useState } from 'react';

export interface AppMessage {
  /** The message data from the app */
  data: any;
  /** Timestamp when received */
  timestamp: number;
}

export interface AppIntegrationOptions {
  /** Callback when actions should be added to a proposal */
  onAddActions?: (actions: ProposalAction[]) => void;
}

export function useAppIntegration(options: AppIntegrationOptions = {}) {
  const [pendingActions, setPendingActions] = useState<ProposalAction[]>([]);
  const [showActionsModal, setShowActionsModal] = useState(false);

  /**
   * Handle messages from the iframe app
   */
  const handleAppMessage = useCallback((messageData: any) => {
    // Check if this is a broadcast request (app wants to submit transactions)
    if (
      messageData &&
      typeof messageData === 'object' &&
      (messageData.type === 'broadcast' || messageData.type === 'execute')
    ) {
      // Extract messages/actions from the app
      const messages = Array.isArray(messageData.messages)
        ? messageData.messages
        : messageData.message
        ? [messageData.message]
        : [];

      if (messages.length > 0) {
        // Convert to ProposalAction format
        const actions: ProposalAction[] = messages.map((msg: any) => ({
          id: crypto.randomUUID(),
          data: msg,
        }));

        setPendingActions(actions);
        setShowActionsModal(true);
      }
    }
  }, []);

  /**
   * Confirm and add pending actions to proposal
   */
  const confirmActions = useCallback(() => {
    if (pendingActions.length > 0) {
      options.onAddActions?.(pendingActions);
      setPendingActions([]);
    }
    setShowActionsModal(false);
  }, [pendingActions, options]);

  /**
   * Cancel pending actions
   */
  const cancelActions = useCallback(() => {
    setPendingActions([]);
    setShowActionsModal(false);
  }, []);

  return {
    handleAppMessage,
    pendingActions,
    showActionsModal,
    confirmActions,
    cancelActions,
  };
}
