import { Network } from '@/delphi-labs/shuttle-react';
import { Chain } from '@/hooks/helpers/assets';
import { createLink } from '@/hooks/helpers/helpers';
import { TERRA } from '@/wallet/chains';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import {
  AuthExtension,
  BankExtension,
  QueryClient,
  setupAuthExtension,
  setupAuthzExtension,
  setupBankExtension,
  setupStakingExtension,
  setupTxExtension,
  StakingExtension,
  TxExtension,
} from '@cosmjs/stargate';
import { HttpBatchClient, Tendermint37Client } from '@cosmjs/tendermint-rpc';
import { assetList as assetsTerra } from 'chain-registry/mainnet/terra2';
import { mapValues } from 'lodash-es';
import { AuthzExtension } from 'node_modules/@cosmjs/stargate/build/modules/authz/queries';
import { CacheService } from './CacheService';
import { ReadService } from './ReadService';
import { WriteService } from './WriteService';

export interface Config {
  chain: Chain;
  icon: string;
  network: Network;
  gasAdjustment: number;
  links: {
    tx: string;
    contract: string;
    address: string;
    token: string;
  };
  contracts: {
    global_config_addr: string;
    oracle: string;
    portfolio: string;

    ampluna: string;
    arbluna: string;
    compounder: string;
  };
  assets: import('@chain-registry/types').AssetList;
  cw20?: string[];
}

export interface ChainInfo {
  config: Config;
  wasmClient: CosmWasmClient;
  queryClient: QueryClient &
    StakingExtension &
    BankExtension &
    TxExtension &
    AuthExtension &
    AuthzExtension;

  linkContract: (addr: string) => string;
}

export type PreparedChainInfo = ChainService['terra'];
export interface ChainClients {
  chainId: Chain;
  read: ReadService;
  write: WriteService;
}
export const useLocalNftindexer = false;
export const useLocalBoostIndexer = true;
const isLocalhost = window.location.hostname === 'localhost';

export const globalCache = new CacheService();

export class ChainService {
  static configs: Record<Chain, Config> = {
    [Chain.Terra]: {
      chain: Chain.Terra,
      icon: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/terra2/images/luna.svg',
      network: TERRA,
      gasAdjustment: 1.3,
      links: {
        tx: 'https://chainsco.pe/terra2/tx/{tx}',
        contract: 'https://chainsco.pe/terra2/address/{contract}',
        address: 'https://chainsco.pe/terra2/address//{address}',
        token: 'https://chainsco.pe/terra2/assets/{token}',
      },
      contracts: {
        global_config_addr: 'terra1skhnhcj653zfkqzd4txcashg0qu4v0vnpckeztgmsm46cqn33lhsxyej6c',
        oracle: 'terra1wj56ld9e9tuuw6qqr8m5ac8h953te65jcxz7c0dgekrud8lxwjgqryuwg3',
        portfolio: 'terra1y6hfmr3lxxj6srduhlfz96x7sga2984pr757a0nrfuqxa9rqxapqcjv4zz',

        arbluna: 'terra1r9gls56glvuc4jedsvc3uwh6vj95mqm9efc7hnweqxa2nlme5cyqxygy5m',
        ampluna: 'terra10788fkzah89xrdm27zkj5yvhj9x3494lxawzm5qq3vvxcqz2yzaqyd3enk',
        compounder: 'terra1zly98gvcec54m3caxlqexce7rus6rzgplz7eketsdz7nh750h2rqvu8uzx',
      },
      assets: assetsTerra,
      cw20: ['ampluna', 'bluna', 'roar', 'capa', 'solid'],
    },
  };

  static chains = mapValues(ChainService.configs, (a) => ChainService.prepare(a.chain));

  terra = ChainService.chains[Chain.Terra];

  constructor() {}

  static getByChain(chain: Chain) {
    return ChainService.chains[chain];
  }

  static getByContract(contract: string) {
    const used = Object.values(ChainService.chains).find((a) =>
      contract?.startsWith(a.config.network.bech32Config?.bech32PrefixAccAddr ?? 'wrong'),
    );
    if (!used) {
      throw new Error(`Chain not found for contract ${contract}`);
    }

    return used;
  }

  static getConfigByContract(contract: string) {
    const used = Object.values(ChainService.configs).find((a) =>
      contract?.startsWith(a.network.bech32Config?.bech32PrefixAccAddr ?? 'wrong'),
    );
    if (!used) {
      throw new Error(`Chain not found for contract ${contract}`);
    }

    return used;
  }
  static getConfigByContractOptional(contract: string) {
    const used = Object.values(ChainService.configs).find((a) =>
      contract?.startsWith(a.network.bech32Config?.bech32PrefixAccAddr ?? 'wrong'),
    );

    return used;
  }

  static prefix(chainId: Chain) {
    return this.configs[chainId].network.bech32Config?.bech32PrefixAccAddr ?? 'unknown';
  }

  static prepare(chainId: Chain) {
    const config = ChainService.configs[chainId];

    const batchClient = new HttpBatchClient(config.network.rpc, {
      batchSizeLimit: 10,
    });
    const tendermint = Tendermint37Client.create(batchClient);

    const wasmClient = CosmWasmClient.create(tendermint);
    const queryClient = QueryClient.withExtensions(
      tendermint,
      setupStakingExtension,
      setupBankExtension,
      setupTxExtension,
      setupAuthExtension,
      setupAuthzExtension,
    );

    const prepared = {
      chainId: chainId,
      config,
      wasmClient,
      queryClient,

      linkToken: (token: string) =>
        createLink(config.links.token, {
          token,
          chain: chainId,
        }),
      linkContract: (contract: string) =>
        createLink(config.links.contract, {
          contract,
          chain: chainId,
        }),
      linkTx: (tx: string) =>
        createLink(config.links.tx, {
          tx,
          chain: chainId,
        }),
      linkAddress: (address: string) =>
        createLink(config.links.address, {
          address,
          chain: chainId,
        }),
      linkAstroport: {},
    };
    const read = new ReadService(globalCache, prepared);
    return {
      ...prepared,
      read,
      write: new WriteService(chainId, read),
      prefix: config.network.bech32Config?.bech32PrefixAccAddr ?? 'unknown',
    };
  }
}

