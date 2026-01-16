import { useSignal } from "@preact/signals-react";
import { useEffect } from "react";

const callbacks: (() => void)[] = [];

export function useElementById(id: string) {
  const element = useSignal<HTMLElement | null>(document.getElementById(id));

  useEffect(() => {
    const callback = () => {
      element.value = document.getElementById(id) ?? null;
    };

    callbacks.push(callback);
    callback();
    return () => {
      callbacks.splice(callbacks.indexOf(callback), 1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return element;
}

if (typeof document !== "undefined") {
  const observer = new MutationObserver(() => {
    for (const callback of callbacks) {
      callback();
    }
  });

  observer.observe(document.body, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}
