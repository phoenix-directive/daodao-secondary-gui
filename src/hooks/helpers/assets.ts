import { assetList } from "@/config/chain-data";
import type { AssetList } from "@chain-registry/types";

export enum Chain {
  Terra = "phoenix-1",
}

export const allAssets = [
  ...(assetList as AssetList).assets.map((a) => ({
    ...a,
    chain: Chain.Terra,
  })),
];
