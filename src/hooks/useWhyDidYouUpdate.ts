import { useEffect, useRef } from 'react';

// Debug hook to track what's causing re-renders

export function useWhyDidYouUpdate(name: string, props: any) {
  const previousProps = useRef<any>(undefined);
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(Date.now());

  // Track mount/unmount
  useEffect(() => {
    console.log(`[${name}] 🟢 Component MOUNTED`);
    return () => {
      console.log(`[${name}] 🔴 Component UNMOUNTING`);
    };
  }, [name]);

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;

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
        console.log(
          `[why-did-you-update] ${name} - Render #${renderCount.current} (+${timeSinceLastRender}ms)`,
          changedProps,
        );
      } else {
        console.log(
          `[why-did-you-update] ${name} - Render #${renderCount.current} (+${timeSinceLastRender}ms) - No prop changes`,
        );
      }
    } else {
      console.log(`[why-did-you-update] ${name} - Initial render`);
    }

    previousProps.current = props;
    lastRenderTime.current = now;
  });
}
