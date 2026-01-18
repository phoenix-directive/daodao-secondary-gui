import { UnifiedCosmosMsg } from '@/daodao/types/contracts';
import { Chain } from '@/hooks/helpers/assets';
import { ChainService } from '@/hooks/helpers/ChainService';
import { getErrorMessageSync, tryGetJsonObjectEnd } from '@/hooks/helpers/helpers';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface ProposalActionsSimulationResult {
  loading: boolean;
  success: boolean;
  error?: string;
  errorData?: any;
  // For multiple choice proposals, track which choice has errors
  choiceErrors?: Map<number, { error: string; errorData?: any }>;
}

// Debug hook to track what's causing re-renders
function useWhyDidYouUpdate(name: string, props: any) {
  const previousProps = useRef<any>(undefined);

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: any = {};

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * Hook to simulate proposal actions directly against the DAO core contract.
 * This validates that the actions will actually execute successfully if the proposal passes.
 *
 * For single choice proposals: simulates the actions array
 * For multiple choice proposals: simulates each choice's actions separately
 */
export function useProposalActionsSimulation(
  daoAddress: string | undefined,
  proposalType: 'single' | 'multiple',
  actions: UnifiedCosmosMsg[], // For single choice
  choices: Array<{ actions: UnifiedCosmosMsg[] }>, // For multiple choice
  debounceTime = 1000,
): ProposalActionsSimulationResult {
  // Debug: Track what's causing re-renders
  useWhyDidYouUpdate('useProposalActionsSimulation', {
    daoAddress,
    proposalType,
    actions,
    choices,
    debounceTime,
  });

  const [result, setResult] = useState<ProposalActionsSimulationResult>({
    loading: false,
    success: true,
  });

  // Memoize chain service and config to prevent recreating on every render
  const chainService = useMemo(() => ChainService.getByChain(Chain.Terra), []);
  const rpcEndpoint = useMemo(() => chainService.config.network.rpc, [chainService]);
  const chainId = useMemo(() => chainService.config.network.chainId, [chainService]);

  // Build messages to simulate
  // Key: When simulating proposal actions, we need to simulate them as if the DAO core
  // contract is executing them (not the user), since that's what happens when a proposal passes
  const messagesToSimulate = useMemo(() => {
    if (!daoAddress) return [];

    if (proposalType === 'single') {
      if (actions.length === 0) return [];
      return [actions];
    } else {
      // For multiple choice, create array of message arrays
      return choices
        .map((choice) => (choice.actions.length > 0 ? choice.actions : null))
        .filter((msgs): msgs is UnifiedCosmosMsg[] => msgs !== null && msgs.length > 0);
    }
  }, [daoAddress, proposalType, actions, choices]);

  const simulate = useCallback(async () => {
    if (messagesToSimulate.length === 0 || !daoAddress) {
      setResult({ loading: false, success: true });
      return;
    }

    setResult({ loading: true, success: false });

    try {
      if (proposalType === 'single') {
        // Simulate single choice
        const msgs = messagesToSimulate[0];
        try {
          await chainService.write.simulateMessages(rpcEndpoint, chainId, daoAddress, msgs);
          setResult({
            loading: false,
            success: true,
          });
        } catch (err) {
          setResult({
            loading: false,
            success: false,
            error: getErrorMessageSync(err),
            errorData: tryGetJsonObjectEnd((err as any).message),
          });
        }
      } else {
        // Simulate multiple choices
        const choiceErrors = new Map<number, { error: string; errorData?: any }>();
        let hasErrors = false;

        for (let i = 0; i < messagesToSimulate.length; i++) {
          const msgs = messagesToSimulate[i];
          try {
            await chainService.write.simulateMessages(rpcEndpoint, chainId, daoAddress, msgs);
          } catch (err) {
            hasErrors = true;
            choiceErrors.set(i, {
              error: getErrorMessageSync(err),
              errorData: tryGetJsonObjectEnd((err as any).message),
            });
          }
        }

        if (hasErrors) {
          setResult({
            loading: false,
            success: false,
            choiceErrors,
            error: `${choiceErrors.size} choice${choiceErrors.size > 1 ? 's have' : ' has'} validation errors`,
          });
        } else {
          setResult({
            loading: false,
            success: true,
          });
        }
      }
    } catch (err) {
      setResult({
        loading: false,
        success: false,
        error: getErrorMessageSync(err),
        errorData: tryGetJsonObjectEnd((err as any).message),
      });
    }
  }, [chainService.write, rpcEndpoint, chainId, daoAddress, messagesToSimulate, proposalType]);

  // Debug: Track simulate callback changes
  const prevSimulate = useRef(simulate);
  useEffect(() => {
    if (prevSimulate.current !== simulate) {
      console.log('[simulate callback changed]');
      prevSimulate.current = simulate;
    }
  });

  // Trigger simulation with debounce
  useEffect(() => {
    console.log('[simulation effect triggered]', {
      hasMessages: messagesToSimulate.length > 0,
      daoAddress,
      debounceTime,
    });

    const timeoutId = setTimeout(() => {
      simulate();
    }, debounceTime);

    return () => clearTimeout(timeoutId);
  }, [simulate, debounceTime]);

  return result;
}
