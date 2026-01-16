import { createPersistedSignal } from '@/lib/signals';

export type HealthBadgeDisplayMode = 'hf' | 'ltv' | 'both';

// Global persisted signal for health badge display mode
export const healthBadgeDisplayMode = createPersistedSignal<HealthBadgeDisplayMode>(
  'creda-health-badge-display',
  'hf',
);

export function useHealthBadgeSettings() {
  return {
    displayMode: healthBadgeDisplayMode.value,
    setDisplayMode: (mode: HealthBadgeDisplayMode) => {
      healthBadgeDisplayMode.value = mode;
    },
  };
}
