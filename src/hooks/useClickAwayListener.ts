import { RefObject, useLayoutEffect } from "react";

export function useClickAwayListener(
  onClickAway: () => void,
  els: (HTMLElement | RefObject<HTMLElement> | null | undefined)[]
) {
  useLayoutEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (els.some((el) => getElement(el)?.contains(e.target as Node))) return;
      onClickAway();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [els, onClickAway]);
}

const getElement = (
  el: HTMLElement | RefObject<HTMLElement> | null | undefined
) => (el && "current" in el ? el.current : el);
