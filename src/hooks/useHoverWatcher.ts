import { useSignal } from "@preact/signals-react";
import { useLayoutEffect, useRef } from "react";

export interface HoverWatcherArgs {
  onEnter?(): void;
  onLeave?(): void;
}

/** Produce a signal & event listeners to track hover state for desktop & mobile.
 *
 * @example
 * const watcherProps = useHoverWatcher({
 *   onEnter: () => (autoPlay.value = false),
 *   onLeave: () => (autoPlay.value = true),
 * });
 * return <div {...watcherProps} />
 */
export function useHoverWatcher({ onEnter, onLeave }: HoverWatcherArgs) {
  const ref = useRef<HTMLElement | undefined>(undefined);
  const isHovered = useSignal(false);

  useLayoutEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current!.contains(e.target as Node)) {
        if (!isHovered.value) {
          isHovered.value = true;
          onEnter?.();
        }
      } else if (isHovered.value) {
        if (isHovered.value) {
          isHovered.value = false;
          onLeave?.();
        }
      }
    };

    document.body.addEventListener("mousemove", handler);
    document.body.addEventListener("touchstart", handler);

    return () => {
      document.body.removeEventListener("mousemove", handler);
      document.body.removeEventListener("touchstart", handler);
      isHovered.value = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ref: (el: HTMLElement) => (ref.current = el),
  };
}
