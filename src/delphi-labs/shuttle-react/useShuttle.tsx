import { ShuttleContext } from "@/delphi-labs/shuttle-react/context";
import { useContext } from "react";

export function useShuttle() {
  const context = useContext(ShuttleContext);

  if (context === undefined) {
    throw new Error(
      "Please wrap your component with ShuttleProvider to call: useShuttle"
    );
  }

  return context;
}
