import { useShuttle } from '@/delphi-labs/shuttle-react';
import { getDecimalInfo } from '@/hooks/helpers/asset-helpers';
import { Chain } from '@/hooks/helpers/assets';
import { isCw20, notEmpty } from '@/hooks/helpers/helpers';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain, useChainByContract } from '@/hooks/useChain';
import { globalReload } from '@/hooks/useReload';
import { orderBy } from 'lodash-es';

export const useAddress = (chain: Chain) => {
  const { wallets } = useShuttle();
  const wallet = wallets.find((a) => a.network.chainId === chain);
  if (!wallet) {
    return '';
  }
  return wallet?.account?.address;
};
export const useIsReadonly = (chain: Chain) => {
  const { wallets } = useShuttle();
  const wallet = wallets.find((a) => a.network.chainId === chain);
  return wallet?.providerId === 'readonly';
};

export const useIsConnected = () => {
  const { wallets } = useShuttle();
  return wallets.length > 0;
};

export const useAddressFromContract = (contract: string) => {
  const chain = useChainByContract(contract);
  return useAddress(chain.chainId);
};

export type Balance = {
  display: string;
  amount: number;
  icon?: string;
  factor: number;
};

// export const useChainTotalSupply = (denom: string) => {
//   const chain = useChainNeutron();

//   return useAsyncSignal(async () => {
//     const coin = await chain.read.supply(denom);
//     const asset = allAssets.find((a) => a.base === coin.denom);
//     const info = getDecimalInfo(coin.denom, asset);

//     return {
//       denom: coin.denom,
//       uamount: +coin.amount,
//       amount: +coin.amount / info.factor,
//       icon: asset?.logoURIs?.svg ?? asset?.logoURIs?.png,
//       asset: asset,
//       info,
//     };
//   }, [denom]);
// };

export const useChainBalance = (chainId: Chain, denom: string, address = '') => {
  const connectedAddress = useAddress(chainId);
  address = address || connectedAddress || '';
  const chain = useChain(chainId);

  return useAsyncSignal(async () => {
    if (!address) {
      return undefined;
    }
    const coin = await chain.read.balance(address, denom);
    const info = getDecimalInfo(coin.denom);

    return {
      denom: coin.denom,
      uamount: +coin.amount,
      amount: +coin.amount / info.factor,
      info,
      icon: info.icon,
      value: coin.denom,
      label: info.display,
    };
  }, [address, denom, globalReload.value]);
};

export const useChainBalances = (chainId: Chain, address?: string, filterUnknown = true) => {
  const connectedAddress = useAddress(chainId);
  address = address || connectedAddress;
  const chain = useChain(chainId);

  return useAsyncSignal(async () => {
    if (!address) {
      return [];
    }

    const cw20s = (chain.config.cw20 ?? [])
      .map(
        (token) =>
          chain.config.assets.assets.find((a) => a.display.toLowerCase() === token)?.address,
      )
      .filter(notEmpty)
      .filter((a) => isCw20(a));

    const cw20tasks = Promise.all(cw20s.map((cw20) => chain.read.balance(address, cw20)));

    const balances = await chain.read.balances(address);
    const additional = (await cw20tasks).filter((a) => +a.amount > 0);

    balances.push(...additional);

    let results = balances.map((coin) => {
      const info = getDecimalInfo(coin.denom);

      return {
        denom: coin.denom,
        uamount: +coin.amount,
        amount: +coin.amount / info.factor,
        info,
        icon: info.icon,

        value: coin.denom,
        label: info.display,
      };
    });

    if (filterUnknown) {
      results = results.filter((a) => !!a.info.meta);
    }
    results = orderBy(
      orderBy(results, (a) => a.label),
      (a) => (a.label.startsWith('..') ? -1 : 1),
      'desc',
    );
    return results;
  }, [address]);
};

export const useKnownTokens = (chainId: Chain) => {
  const chain = useChain(chainId);
  let results = chain.config.assets.assets.map((info) => {
    let denom = info.base;

    if (denom.startsWith('cw20:')) {
      denom = denom.substring(5);
    }

    const { decimals, factor, display } = getDecimalInfo(denom);

    return {
      denom: denom,
      decimals,
      factor,
      display,
      info,
      icon: info?.logoURIs?.svg ?? info?.logoURIs?.png,

      value: denom,
      label: display,
    };
  });

  results = orderBy(
    orderBy(results, (a) => a.display),
    (a) => (a.display.startsWith('..') ? -1 : 1),
    'desc',
  );
  return results;
};
