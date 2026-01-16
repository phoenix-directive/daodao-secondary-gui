import { ShuttleContextType } from "@/delphi-labs/shuttle-react/provider";
import { createContext } from "react";

export const ShuttleContext = createContext<ShuttleContextType | undefined>(
  undefined
);
