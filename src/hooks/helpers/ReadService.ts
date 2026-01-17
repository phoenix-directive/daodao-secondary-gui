import { Chain } from '@/hooks/helpers/assets';
import { getAssetInfoOld, isCw20 } from '@/hooks/helpers/helpers';
import { CacheService } from './CacheService';
import { ChainInfo } from './ChainService';
import { PairResponse } from './read.model';

export class ReadService {
  chain: Chain;
  constructor(private cache: CacheService, public clients: ChainInfo) {
    this.chain = clients.config.chain;
  }

  queryMemory<T, T2 = any>(contract: string, query: T2): Promise<T> {
    return this.cache.getMemoryCached(
      `query_memory_${contract}_${JSON.stringify(query)}`,
      1,
      () => {
        return this.query(contract, query);
      },
    );
  }
  queryCached<T, T2 = any>(contract: string, query: T2, time_min?: number): Promise<T> {
    return this.cache.getCached(
      `query_${contract}_${JSON.stringify(query)}`,
      time_min ?? 1 * 60,
      () => {
        return this.query(contract, query);
      },
    );
  }
  queryCachedMapped<T, T2 = any>(
    contract: string,
    query: T2,
    map: (a: any) => Promise<T>,
    time_min?: number,
  ): Promise<T> {
    return this.cache.getCached(
      `query_map_${contract}_${JSON.stringify(query)}`,
      time_min ?? 1 * 60,
      () => {
        return this.query(contract, query).then((res) => map(res));
      },
    );
  }

  balances(address: string) {
    return this.clients.queryClient.bank.allBalances(address);
  }

  balance(address: string, denom: string) {
    if (isCw20(denom)) {
      return this.query<{ balance: string }>(denom, {
        balance: { address: address },
      }).then((result) => ({ denom: denom, amount: result.balance }));
    }

    return this.clients.queryClient.bank.balance(address, denom);
  }

  supply(denom: string) {
    return this.clients.queryClient.bank.supplyOf(denom);
  }

  findPair(factory: string, from: string, to: string) {
    return this.query<PairResponse>(factory, {
      pair: {
        asset_infos: [getAssetInfoOld(from), getAssetInfoOld(to)],
      },
    });
  }

  async tx(hash: string) {
    const client = await this.clients.queryClient;
    return await client.tx.getTx(hash);
  }

  /**
   * Query raw contract state via RPC endpoint
   * More optimal than using CosmWasm client for large state queries
   */
  async queryRaw(
    contract: string,
    limit: number,
    paginationKey?: string,
  ): Promise<{
    models: Array<{ key: string; value: string }>;
    pagination?: { next_key: string | null };
  }> {
    const url = new URL(
      `/cosmwasm/wasm/v1/contract/${contract}/state`,
      this.clients.config.network.rest,
    );

    url.searchParams.set('pagination.limit', limit.toString());
    if (paginationKey) {
      url.searchParams.set('pagination.key', paginationKey);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch contract state: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      models: data.models || [],
      pagination: data.pagination || { next_key: null },
    };
  }

  query<T, T2 = any>(contract: string, query: T2): Promise<T> {
    const client = this.clients.wasmClient;

    if (!contract) {
      return Promise.resolve(undefined) as any;
    }

    return client.queryContractSmart(contract, query).then(
      (result) => {
        console.groupCollapsed(`WASM ${this.chain} ${Object.keys(query as any).join(',')}`);
        console.log(this.clients.linkContract(contract));
        console.log(
          this.clients.config.network.rest +
            `/cosmwasm/wasm/v1/contract/${contract}/smart/${btoa(JSON.stringify(query))}`,
        );
        console.log('Request');
        console.log(query);
        console.log('Response');
        console.log(result);
        console.groupEnd();
        return result;
      },
      (result) => {
        console.groupCollapsed(`ERROR ${this.chain} ${Object.keys(query as any).join(',')}`);
        console.warn(
          this.clients.config.network.rest +
            `/cosmwasm/wasm/v1/contract/${contract}/smart/${btoa(JSON.stringify(query))}`,
        );
        console.warn(this.clients.linkContract(contract));
        console.warn('Request');
        console.warn(query);
        console.warn('Error');
        console.warn(result);
        console.groupEnd();
        throw result;
      },
    );
  }
}
