/**
 * Apps configuration
 */

export interface AppDefinition {
  id: string;
  name: string;
  platform?: string;
  description: string;
  url: string;
  imageUrl: string;
  chainIdFilter?: {
    include?: string[];
    exclude?: string[];
  };
}

export const PREDEFINED_APPS: AppDefinition[] = [
  {
    id: 'astroport',
    name: 'Astroport',
    platform: 'DeFi',
    description: 'Decentralized exchange and liquidity protocol',
    url: 'https://app.astroport.fi',
    imageUrl: 'https://astroport.fi/astroport-logo.png',
  },
  {
    id: 'warp',
    name: 'Warp Protocol',
    platform: 'Automation',
    description: 'Automated transaction execution',
    url: 'https://app.warp.money',
    imageUrl: 'https://warp.money/logo.png',
  },
  {
    id: 'white-whale',
    name: 'White Whale',
    platform: 'DeFi',
    description: 'Interchain liquidity and arbitrage',
    url: 'https://app.whitewhale.money',
    imageUrl: 'https://whitewhale.money/logo.png',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Enter a custom app URL',
    url: '',
    imageUrl: '',
  },
];

// Helper to validate URLs
const ALLOWED_URL_REGEX = /^https?:\/\/.+[^\.]$/;

export function isUrlValid(url: string): true | string {
  try {
    if (!!url && !!new URL(url).href && ALLOWED_URL_REGEX.test(url)) {
      return true;
    } else {
      return 'Invalid URL.';
    }
  } catch (err) {
    return err instanceof Error ? err.message : 'Invalid URL format';
  }
}

export function filterAppsByChain(apps: AppDefinition[], chainId: string): AppDefinition[] {
  return apps.filter(
    ({ chainIdFilter }) =>
      (!chainIdFilter?.include || chainIdFilter.include.includes(chainId)) &&
      (!chainIdFilter?.exclude || !chainIdFilter.exclude.includes(chainId)),
  );
}
