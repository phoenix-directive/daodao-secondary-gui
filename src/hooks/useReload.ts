import { signal } from '@preact/signals-react';

export const globalReload = signal(0);

export const triggerReload = (delay_ms: number = 0) => {
  if (delay_ms === 0) {
    globalReload.value = globalReload.value + 1;
  } else {
    setTimeout(() => {
      globalReload.value = globalReload.value + 1;
    }, delay_ms);
  }
};

export const useReload = () => {
  return globalReload;
};
