import { useSignal, type Signal } from "@preact/signals-react";
import { useMemo } from "react";

export function useDefaultSignal<T>(
  sig: Signal<T> | T | undefined,
  defaultValue: T
) {
  // this is a hack - we gotta call `useSignal` to get the reactivity
  // so we always create the signal, even if it's not used in the end
  // which kinda sucks but satisfies the linter & avoids crashes relating to hooks misuse
  const fallback = useSignal(
    !isSignalLike(sig) && sig !== undefined ? sig : defaultValue
  );
  return useMemo(() => (isSignalLike(sig) ? sig : fallback), [sig, fallback]);
}

const isSignalLike = <T = unknown>(value: any): value is Signal<T> =>
  typeof value === "object" &&
  value !== null &&
  "value" in value &&
  typeof value.peek === "function" &&
  typeof value.subscribe === "function";
