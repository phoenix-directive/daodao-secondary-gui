import { AssetInfoBaseFor_Addr } from '@/generated/chain/creda-oracle/response_to_get_offer';
import { allAssets } from '@/hooks/helpers/assets';

export interface AssetMeta {
  denom: string;
  symbol: string;
  display: string;
  decimals: number;
  icon?: string;
  icon2?: string;
  category?: AssetCategory;
  compounder?: {
    gauge: string;
    asset: AssetInfoBaseFor_Addr;
  };
}

export enum AssetCategory {
  CORE = 'core',
  STABLECOIN = 'stablecoin',
  LST = 'lst',
  LP = 'lp',
  OTHER = 'other',
}

/**
 * Asset configuration mapping from denom to display information
 * This provides human-readable names, symbols, and icons for each asset
 */
export const ASSET_META: Record<string, AssetMeta> = {
  // Native Terra assets
  uluna: {
    denom: 'uluna',
    symbol: 'LUNA',
    display: 'LUNA',
    decimals: 6,
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/terra2/images/luna.svg',
    category: AssetCategory.CORE,
  },
  'ibc/0EF5630576C66968EF0787868CF09FD866FAD131BC148D24A148358A85F0EB62': {
    denom: 'ibc/0EF5630576C66968EF0787868CF09FD866FAD131BC148D24A148358A85F0EB62',
    symbol: 'PAXG',
    display: 'Paxos Gold',
    decimals: 18,
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/paxg.svg',
    category: AssetCategory.CORE,
  },
  'ibc/A356EC90DC3AE43D485514DA7260EDC7ABB5CFAA0654CE2524C739392975AD3C': {
    denom: 'ibc/A356EC90DC3AE43D485514DA7260EDC7ABB5CFAA0654CE2524C739392975AD3C',
    symbol: 'wstETH',
    display: 'Wrapped Staked ETH',
    decimals: 18,
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/wsteth.svg',
    category: AssetCategory.LST,
  },
  'ibc/88386AC48152D48B34B082648DF836F975506F0B57DBBFC10A54213B1BF484CB': {
    denom: 'ibc/88386AC48152D48B34B082648DF836F975506F0B57DBBFC10A54213B1BF484CB',
    symbol: 'wBTC',
    display: 'Wrapped Bitcoin',
    decimals: 8,
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/wbtc.svg',
    category: AssetCategory.CORE,
  },

  'ibc/2C962DAB9F57FE0921435426AE75196009FAA1981BF86991203C8411F8980FDB': {
    denom: 'ibc/2C962DAB9F57FE0921435426AE75196009FAA1981BF86991203C8411F8980FDB',
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/usdc.svg',
    symbol: 'USDC',
    display: 'USDC',
    decimals: 6,
    category: AssetCategory.STABLECOIN,
  },
  'ibc/8D52B251B447B7160421ACFBD50F6B0ABE5F98D2C404B03701130F12044439A1': {
    denom: 'ibc/8D52B251B447B7160421ACFBD50F6B0ABE5F98D2C404B03701130F12044439A1',
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/eure.svg',
    symbol: 'EURE',
    display: 'Monerium EURE',
    decimals: 6,
    category: AssetCategory.STABLECOIN,
  },
  terra1se7rvuerys4kd2snt6vqswh9wugu49vhyzls8ymc02wl37g2p2ms5yz490: {
    denom: 'terra1se7rvuerys4kd2snt6vqswh9wugu49vhyzls8ymc02wl37g2p2ms5yz490',
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/terra2/images/arbluna.svg',
    symbol: 'arbLUNA',
    display: 'ERIS Arbitrage LUNA',
    decimals: 6,
    category: AssetCategory.LST,
  },
  terra1ecgazyd0waaj3g7l9cmy5gulhxkps2gmxu9ghducvuypjq68mq2s5lvsct: {
    denom: 'terra1ecgazyd0waaj3g7l9cmy5gulhxkps2gmxu9ghducvuypjq68mq2s5lvsct',
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/terra2/images/ampluna.svg',
    symbol: 'ampLUNA',
    display: 'ERIS Amplified LUNA',
    decimals: 6,
    category: AssetCategory.LST,
  },

  'factory/terra1zly98gvcec54m3caxlqexce7rus6rzgplz7eketsdz7nh750h2rqvu8uzx/32/project/amplp': {
    denom:
      'factory/terra1zly98gvcec54m3caxlqexce7rus6rzgplz7eketsdz7nh750h2rqvu8uzx/32/project/amplp',
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/terra2/images/luna.svg',
    icon2:
      'https://raw.githubusercontent.com/cosmos/chain-registry/master/terra2/images/ampluna.svg',
    symbol: 'LUNA-ampLUNA',
    display: 'Amplified LP',
    decimals: 6,
    category: AssetCategory.LP,
    compounder: {
      gauge: 'project',
      asset: {
        cw20: 'terra1my4tml2ae4zewq0u5fpq2qzq4rdpfh5pq7y3eekxxhwxdwdmce4shw9mt4',
      },
    },
  },

  'factory/terra1zly98gvcec54m3caxlqexce7rus6rzgplz7eketsdz7nh750h2rqvu8uzx/52/single/amplp': {
    denom:
      'factory/terra1zly98gvcec54m3caxlqexce7rus6rzgplz7eketsdz7nh750h2rqvu8uzx/52/single/amplp',
    icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/usdc.svg',
    icon2:
      'https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/usdt.svg',
    symbol: 'USDC-USDT',
    display: 'Amplified LP',
    decimals: 6,
    category: AssetCategory.LP,
    compounder: {
      gauge: 'single',
      asset: {
        cw20: 'terra1huw82c9grj9xz9umkc8hqcjqgndadlkrp8rn9u6eh5jh5j2s2t7qs33vry',
      },
    },
  },
  // // IBC USDC
  // 'ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4': {
  //   denom: 'ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4',
  //   symbol: 'axlUSDC',
  //   display: 'Axelar USDC',
  //   decimals: 6,
  //   icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/axelar/images/usdc.png',
  //   category: 'stablecoin',
  // },
  // Add more assets as needed
};

export const ASSET_META_LIST: AssetMeta[] = Object.values(ASSET_META);

/**
 * Get asset configuration for a given AssetInfoBaseFor_Addr
 */
export function getAssetMeta(denom: string): AssetMeta {
  // Try to get from hardcoded config first
  if (ASSET_META[denom]) {
    return ASSET_META[denom];
  }

  // Try to find in chain registry assets
  const registryAsset = allAssets.find((a) => a.base === denom || a.address === denom);
  if (registryAsset) {
    // Try to infer category from asset type or keywords
    let category: AssetCategory = AssetCategory.OTHER;
    const symbol = registryAsset.symbol?.toLowerCase() || '';
    const display = registryAsset.display?.toLowerCase() || '';
    if (symbol.includes('usdc') || symbol.includes('usd') || display.includes('usd')) {
      category = AssetCategory.STABLECOIN;
    } else if (symbol.includes('luna')) {
      category = AssetCategory.CORE;
    } else if (display.includes('stake') || symbol.includes('stluna') || symbol.includes('lst')) {
      category = AssetCategory.LST;
    }
    return {
      denom,
      symbol: registryAsset.symbol || formatDenomSymbol(denom),
      display: registryAsset.display || formatDenomDisplay(denom),
      decimals: Math.max(...(registryAsset.denomUnits?.map((u) => u.exponent) || [6])),
      icon: registryAsset.logoURIs?.png || registryAsset.logoURIs?.svg,
      category,
    };
  }

  // Fallback to formatted defaults
  return {
    denom,
    symbol: formatDenomSymbol(denom),
    display: formatDenomDisplay(denom),
    decimals: 6, // Default to 6 decimals
    category: AssetCategory.OTHER,
  };
}

/**
 * Format a raw denom into a readable symbol
 */
function formatDenomSymbol(denom: string): string {
  // Handle factory tokens
  if (denom.startsWith('factory/')) {
    const parts = denom.split('/');
    return parts[parts.length - 1].toUpperCase();
  }

  // Handle IBC tokens
  if (denom.startsWith('ibc/')) {
    return 'IBC';
  }

  // Handle native tokens starting with 'u'
  if (denom.startsWith('u')) {
    return denom.substring(1).toUpperCase();
  }

  // For contract addresses, show shortened version
  if (denom.length > 20) {
    return denom.substring(0, 8).toUpperCase();
  }

  return denom.toUpperCase();
}

/**
 * Format a raw denom into a readable display name
 */
function formatDenomDisplay(denom: string): string {
  // Handle factory tokens
  if (denom.startsWith('factory/')) {
    const parts = denom.split('/');
    return parts[parts.length - 1];
  }

  // Handle IBC tokens
  if (denom.startsWith('ibc/')) {
    return `IBC Token`;
  }

  // Handle native tokens starting with 'u'
  if (denom.startsWith('u')) {
    const name = denom.substring(1);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // For contract addresses, show shortened version
  if (denom.length > 20) {
    return `${denom.substring(0, 6)}...${denom.substring(denom.length - 4)}`;
  }

  return denom;
}
