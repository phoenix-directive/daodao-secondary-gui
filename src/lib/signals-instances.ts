/**
 * Global signal instances for application-wide state
 */

import { computed } from '@preact/signals-react';
import { createPersistedSignal } from './signals';

export interface DaoItem {
  address: string;
  name: string;
  imageUrl?: string | null;
}

// Persisted signals for DAO management
export const recentDaos = createPersistedSignal<DaoItem[]>('recentDaos', []);
export const favoriteDaos = createPersistedSignal<DaoItem[]>('favoriteDaos', []);

// Helper computed signals
export const favoriteAddresses = computed(
  () => new Set(favoriteDaos.value.map((dao) => dao.address)),
);

// Helper functions
export function addRecentDao(dao: DaoItem) {
  const recent = recentDaos.value;
  const filtered = recent.filter((d) => d.address !== dao.address);
  recentDaos.value = [dao, ...filtered].slice(0, 10); // Keep last 10
}

export function toggleFavorite(dao: DaoItem): boolean {
  const favorites = favoriteDaos.value;
  const index = favorites.findIndex((d) => d.address === dao.address);

  if (index !== -1) {
    // Remove from favorites
    favoriteDaos.value = favorites.filter((_, i) => i !== index);
    return false;
  } else {
    // Add to favorites
    favoriteDaos.value = [...favorites, dao];
    return true;
  }
}

export function isFavorite(address: string): boolean {
  return favoriteAddresses.value.has(address);
}
