import { assetList } from '@/config/chain-data';

export enum Chain {
  Terra = 'phoenix-1',
}

export const allAssets = [
  ...assetList.assets.map((a) => ({
    ...a,
    chain: Chain.Terra,
  })),
];
