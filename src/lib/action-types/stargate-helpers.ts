/**
 * Helper utilities for stargate action types
 * Provides reusable pattern for decoding base64-encoded protobuf messages
 */

import { decodeStargateMessage, encodeProtobufValue } from '@/daodao/protobuf/utils';
import type { StargateMsg } from '@/daodao/types/contracts';

// Convert Uint8Array to base64 string
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Creates a type guard for stargate messages that automatically decodes base64 values
 * Stores decoded value in _decoded property without mutating original data
 *
 * @param typeUrl - The protobuf typeUrl to match (e.g., '/cosmos.staking.v1beta1.MsgDelegate')
 * @param valueGuard - Optional additional validation for the decoded value
 * @returns Type guard function that decodes and validates the message
 *
 * @example
 * const isStakingDelegate = createStargateTypeGuard<StakingDelegateValue>(
 *   '/cosmos.staking.v1beta1.MsgDelegate',
 *   (value) => 'validatorAddress' in value && 'amount' in value
 * );
 */
export function createStargateTypeGuard<T = any>(
  typeUrl: string,
  valueGuard?: (value: any) => boolean,
) {
  return (data: any): data is StargateActionWithDecoded<T> => {
    if (!data?.stargate) {
      return false;
    }

    const stargate = data.stargate;

    // Check typeUrl (handle both type_url and typeUrl)
    const msgTypeUrl = stargate.type_url || stargate.typeUrl;
    if (msgTypeUrl !== typeUrl) {
      return false;
    }

    // If value is a base64 string and not yet decoded, decode it
    if (typeof stargate.value === 'string' && !stargate._decoded) {
      try {
        // Create a temporary StargateMsg for decoding
        const temp: StargateMsg = {
          stargate: {
            type_url: msgTypeUrl,
            value: stargate.value,
          },
        };

        // Decode the message and store in _decoded property
        const decoded = decodeStargateMessage(temp);
        stargate._decoded = decoded.stargate.value;
      } catch (error) {
        console.error('Failed to decode stargate message:', error);
        return false;
      }
    }

    // Get the value to validate (either _decoded or the raw value if already decoded)
    const valueToValidate = stargate._decoded || stargate.value;

    // Apply additional value validation if provided
    if (valueGuard && !valueGuard(valueToValidate)) {
      return false;
    }

    return true;
  };
}

/**
 * Helper to get the decoded value from a stargate action
 * Works with both encoded (base64) and already-decoded values
 */
export function getStargateValue<T>(action: StargateActionWithDecoded<T>): T {
  const value = action.stargate._decoded || action.stargate.value;
  // If value is still a string (base64), this shouldn't happen after guard runs
  // but we handle it defensively
  if (typeof value === 'string') {
    throw new Error('Stargate value is still encoded. Ensure the type guard has run first.');
  }
  return value as T;
}

/**
 * Helper to update a decoded stargate value and properly re-encode it
 * Use this instead of directly calling onUpdate with nested paths like ['stargate', 'value', 'field']
 * 
 * @param action - The current stargate action data
 * @param onUpdate - The form's onUpdate callback
 * @param updates - Object with fields to update in the decoded value
 * 
 * @example
 * updateStargateValue(data, onUpdate, { validatorAddress: 'cosmos1...' })
 * updateStargateValue(data, onUpdate, { amount: { denom: 'uluna', amount: '1000000' } })
 */
export function updateStargateValue<T extends Record<string, any>>(
  action: StargateActionWithDecoded<T>,
  onUpdate: (path: string[], value: any) => void,
  updates: Partial<T>,
): void {
  // Get current decoded value
  const currentValue = getStargateValue(action);
  
  // Merge updates with current value
  const newDecodedValue = { ...currentValue, ...updates };
  
  // Get the type URL
  const typeUrl = action.stargate.type_url || '';
  
  // Re-encode the updated value to base64-encoded protobuf
  const encodedBytes = encodeProtobufValue(typeUrl, newDecodedValue);
  const base64Value = toBase64(encodedBytes);
  
  // Update with properly encoded value and decoded cache
  onUpdate(['stargate'], {
    type_url: typeUrl,
    value: base64Value,
    _decoded: newDecodedValue,
  });
}

/**
 * Type definition for stargate message with optional decoded value
 */
export type StargateActionWithDecoded<T> = {
  stargate: {
    type_url?: string;
    value: T | string; // string when base64 encoded, T when already decoded
    _decoded?: T; // Decoded value stored separately
  };
};

/**
 * Type definition for decoded stargate message (what components should work with)
 */
export type StargateAction<T> = {
  stargate: {
    typeUrl: string;
    value: T;
  };
};
