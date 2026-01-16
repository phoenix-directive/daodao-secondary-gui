import { Chain } from '@/hooks/helpers/assets';
import { ChainService } from '@/hooks/helpers/ChainService';
import { useAsyncSignal } from './useAsyncSignal';
import { useAddress } from './useWallet';

export const useChain = (chain: Chain) => {
  return ChainService.chains[chain];
};
export const useChainId = (contract: string) => {
  // const service = useResolve(ChainService);
  const used = Object.values(ChainService.configs).find((a) =>
    contract?.startsWith(a.network.bech32Config?.bech32PrefixAccAddr ?? 'wrong'),
  );

  if (!used) {
    throw new Error(`Chain not found for contract ${contract}`);
  }
  return used.chain;
};
export const useChainByContract = (contract: string) => {
  // const service = useResolve(ChainService);
  const used = Object.values(ChainService.configs).find((a) =>
    contract?.startsWith(a.network.bech32Config?.bech32PrefixAccAddr ?? 'wrong'),
  );

  if (!used) {
    throw new Error(`Chain not found for contract ${contract}`);
  }

  return ChainService.chains[used.chain];
};
export const useChainByContractOptional = (contract: string | null | undefined) => {
  // const service = useResolve(ChainService);
  const used = Object.values(ChainService.configs).find((a) =>
    contract?.startsWith(a.network.bech32Config?.bech32PrefixAccAddr ?? 'wrong'),
  );

  if (!used) {
    return undefined;
  }

  return ChainService.chains[used.chain];
};

export const useChainDaoStakedTotalPower = (contract: string) => {
  const chain = useChainByContract(contract);

  return useAsyncSignal(async () => {
    if (!contract) {
      return undefined;
    }
    const result = await chain.read.query<{
      power: string;
      height: number;
    }>(contract, {
      total_power_at_height: {},
    });
    return {
      power: +result.power,
    };
  }, [contract]);
};

export const useChainDaoStakedUser = (contract: string) => {
  const chain = useChainByContract(contract);
  const address = useAddress(chain.chainId);

  return useAsyncSignal(async () => {
    if (!contract || !address) {
      return undefined;
    }
    const result = await chain.read.queryCached<{
      power: string;
      height: number;
    }>(
      contract,
      {
        voting_power_at_height: {
          address,
        },
      },
      1440,
    );
    return {
      power: +result.power,
    };
  }, [contract, address]);
};
