import { useLayoutEffect } from 'react';

const BASE_TITLE = 'DAO';

export function usePageMeta(className: string, displayName: string) {
  useLayoutEffect(() => {
    if (displayName) {
      document.title = `${displayName} | ${BASE_TITLE}`;
    } else {
      document.title = BASE_TITLE;
    }

    document.body.classList.add(`Page-${className}`);
    return () => {
      document.body.classList.remove(`Page-${className}`);
      document.title = BASE_TITLE;
    };
  }, [className, displayName]);
}
