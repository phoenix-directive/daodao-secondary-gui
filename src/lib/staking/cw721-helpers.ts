/**
 * Helper functions for CW721 (NFT) staking
 * Provides NFT query logic for CW721 staked voting modules
 */

import type { Config, NftClaim } from '@/daodao/types/contracts/DaoVotingCw721Staked';
import { ChainClients } from '@/hooks/helpers/ChainService';
import { getIpfsLink } from '@/hooks/helpers/helpers';

// Cache duration constants
const CONFIG_CACHE_DURATION = 24 * 60; // 1 day in minutes
const TOKEN_INFO_CACHE_DURATION = 60 * 24 * 7; // 7 days in minutes

export interface NftInfo {
  tokenId: string;
  tokenUri?: string;
  imageUrl?: string;
  name?: string;
}

export interface NftMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type?: string;
    value?: string | number;
  }>;
}

/**
 * Query the CW721 staking contract configuration
 */
export async function getCw721StakingConfig(
  stakingContractAddress: string,
  chain: ChainClients,
): Promise<Config> {
  const config = await chain.read.queryCached<Config>(
    stakingContractAddress,
    { config: {} },
    CONFIG_CACHE_DURATION,
  );
  return config;
}

/**
 * Query user's voting power
 */
export async function getUserVotingPower(
  stakingContractAddress: string,
  userAddress: string,
  chain: ChainClients,
): Promise<string> {
  const result = await chain.read.query<{ power: string; height: number }>(stakingContractAddress, {
    voting_power_at_height: {
      address: userAddress,
    },
  });
  return result.power;
}

/**
 * Query all token IDs owned by an address from a CW721 contract
 */
export async function getUserNfts(
  nftContractAddress: string,
  ownerAddress: string,
  chain: ChainClients,
  limit: number = 100,
): Promise<string[]> {
  const allTokenIds: string[] = [];
  let startAfter: string | undefined = undefined;

  while (true) {
    const response: { tokens: string[] } = await chain.read.query<{ tokens: string[] }>(
      nftContractAddress,
      {
        tokens: {
          owner: ownerAddress,
          limit,
          start_after: startAfter,
        },
      },
    );

    allTokenIds.push(...response.tokens);

    // If we got fewer tokens than the limit, we've reached the end
    if (response.tokens.length < limit) {
      break;
    }

    // Set start_after to the last token ID for pagination
    startAfter = response.tokens[response.tokens.length - 1];
  }

  return allTokenIds;
}

/**
 * Query staked NFTs for a user
 */
export async function getUserStakedNfts(
  stakingContractAddress: string,
  userAddress: string,
  chain: ChainClients,
  limit: number = 100,
): Promise<string[]> {
  const allTokenIds: string[] = [];
  let startAfter: string | undefined = undefined;

  while (true) {
    const response: string[] = await chain.read.query<string[]>(stakingContractAddress, {
      staked_nfts: {
        address: userAddress,
        limit,
        start_after: startAfter,
      },
    });

    allTokenIds.push(...(response || []));

    // If we got fewer tokens than the limit, we've reached the end
    if (!response || response.length < limit) {
      break;
    }

    // Set start_after to the last token ID for pagination
    startAfter = response[response.length - 1];
  }

  return allTokenIds;
}

/**
 * Query NFT claims (unbonding NFTs)
 */
export async function getUserNftClaims(
  stakingContractAddress: string,
  userAddress: string,
  chain: ChainClients,
): Promise<{ nft_claims: NftClaim[] }> {
  const result = await chain.read.query<{ nft_claims: NftClaim[] }>(stakingContractAddress, {
    nft_claims: {
      address: userAddress,
    },
  });
  return result;
}

/**
 * Query token info for a single NFT
 */
export async function getNftTokenInfo(
  nftContractAddress: string,
  tokenId: string,
  chain: ChainClients,
): Promise<{
  token_uri?: string;
  extension?: {
    image?: string;
    name?: string;
    description?: string;
    [key: string]: any;
  };
}> {
  const result = await chain.read.queryCached<{
    token_uri?: string;
    extension?: any;
  }>(
    nftContractAddress,
    {
      nft_info: {
        token_id: tokenId,
      },
    },
    TOKEN_INFO_CACHE_DURATION,
  );
  return result;
}

/**
 * Fetch metadata from token URI (IPFS or HTTP)
 */
export async function fetchNftMetadata(tokenUri: string): Promise<NftMetadata | null> {
  try {
    // Handle IPFS URIs
    let url = tokenUri;
    if (tokenUri.startsWith('ipfs://')) {
      const { fallbackSrc } = getIpfsLink(tokenUri, 0);
      url = fallbackSrc || tokenUri;
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch NFT metadata from ${url}`);
      return null;
    }

    const metadata: NftMetadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

/**
 * Get NFT info with metadata (image, name, etc.)
 * This combines token_info query with metadata fetching
 */
export async function getNftInfoWithMetadata(
  nftContractAddress: string,
  tokenId: string,
  chain: ChainClients,
): Promise<NftInfo> {
  const tokenInfo = await getNftTokenInfo(nftContractAddress, tokenId, chain);

  const nftInfo: NftInfo = {
    tokenId,
    tokenUri: tokenInfo.token_uri,
  };

  if (tokenInfo.extension) {
    nftInfo.name = tokenInfo.extension.name;
    nftInfo.imageUrl = tokenInfo.extension.image;
    return nftInfo;
  }

  // Try to fetch metadata if token_uri exists
  if (tokenInfo.token_uri) {
    const metadata = await fetchNftMetadata(tokenInfo.token_uri);
    console.log('🚀 ~ getNftInfoWithMetadata ~ metadata:', metadata);
    if (metadata) {
      nftInfo.name = metadata.name;
      nftInfo.imageUrl = metadata.image;
    }
  }

  return nftInfo;
}

/**
 * Batch fetch NFT info for multiple token IDs
 */
export async function batchGetNftInfo(
  nftContractAddress: string,
  tokenIds: string[],
  chain: ChainClients,
): Promise<NftInfo[]> {
  // Fetch all token info in parallel (limit concurrency to avoid rate limiting)
  const batchSize = 10;
  const results: NftInfo[] = [];

  for (let i = 0; i < tokenIds.length; i += batchSize) {
    const batch = tokenIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((tokenId) => getNftInfoWithMetadata(nftContractAddress, tokenId, chain)),
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Get displayable image URL from NFT info
 * Converts IPFS URLs to gateway URLs
 */
export function getNftImageUrl(imageUrl: string | undefined, size: 160 | 440 = 160): string {
  if (!imageUrl) {
    return '';
  }

  if (imageUrl.startsWith('ipfs://')) {
    const { src, fallbackSrc } = getIpfsLink(imageUrl, size);
    return src || fallbackSrc || imageUrl;
  }

  return imageUrl;
}
