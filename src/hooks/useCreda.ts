import { ASSET_META_LIST } from '@/config/assets';
import { AssetInfoBaseFor_Addr } from '@/generated/chain/creda-oracle/response_to_get_offer';
import { RateFunction } from '@/generated/chain/creda-portfolio/execute';
import { QueryMsg as QueryMsgPortfolio } from '@/generated/chain/creda-portfolio/query';
import { RatePoint } from '@/generated/chain/creda-portfolio/response_to_asset_state';
import { MetricResponse } from '@/generated/chain/creda-portfolio/response_to_metric';
import { EmodeGroup, Metrics } from '@/generated/chain/creda-portfolio/response_to_metrics';
import { StateResponse } from '@/generated/chain/creda-portfolio/response_to_state';
import { getDecimalInfo } from '@/hooks/helpers/asset-helpers';
import { Chain } from '@/hooks/helpers/assets';
import { globalCache, PreparedChainInfo as UseChainResult } from '@/hooks/helpers/ChainService';
import {
  aprToApy,
  forkPromise,
  getAssetInfo,
  getDenom,
  interpolateBetweenTwoPoints,
  notEmpty,
  toNumb,
} from '@/hooks/helpers/helpers';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { globalReload } from '@/hooks/useReload';
import { useAddress } from '@/hooks/useWallet';
import { signalIncludeAssetApy } from '@/lib/signals';
import { take } from 'lodash-es';

export type UseMetricsAddressResult = Exclude<
  ReturnType<typeof useCredaMetricsAddress>['data']['value'],
  undefined | null
>;
export type UseMetricAddressResult = Exclude<
  ReturnType<typeof useCredaMetricAsset>['data']['value'],
  undefined | null
>;
export type AddressPortfolioPricedResult = UseMetricsAddressResult['portfolio'];
export type AssetMetricsResult = UseMetricsAddressResult['assets'][number];
export type AssetSuppliedResult = UseMetricsAddressResult['portfolio']['supplied'][number];

export type AssetMetricResult = UseMetricAddressResult['asset_metrics'];
export type AssetMetricPortfolio = UseMetricAddressResult['portfolio'];

export type UseMetricsResult = Exclude<
  ReturnType<typeof useCredaMetrics>['data']['value'],
  undefined | null
>;
export type UseMetricsAsset = UseMetricsResult['assets'][number];

export const useAdditionalApyMetrics = () => {
  const chain = useChain(Chain.Terra);
  return useAsyncSignal(() => {
    return getAdditionalApys(chain);
  }, [globalReload.value]);
};

function getSupplyApys({
  apySupply,
  apyAsset,
  takerate,
  utilization,
}: {
  apySupply: number;
  apyAsset: number;
  takerate: RateFunction | undefined | null;
  utilization: number;
}) {
  const apyTakerate = -getTakeRate(utilization, takerate);
  return {
    apySupply: apySupply,
    apyAsset: apyAsset,
    apyTakerate: apyTakerate,
    apyTotal: apySupply + apyTakerate + (signalIncludeAssetApy.value ? apyAsset : 0),
  };
}

function getBorrowApys({ apyBorrow, apyAsset }: { apyBorrow: number; apyAsset: number }) {
  return {
    borrowApyAsset: apyAsset,
    borrowApyTotal: apyBorrow + (signalIncludeAssetApy.value ? apyAsset : 0),
  };
}

function getAssetLimits({
  total_supplied: totalSupplied,
  total_borrowed: totalBorrowed,
  price_usd: price,
  decimalFactor,
  supplyCap,
  borrowCap,
  userBalance,
  suppliedAmount,
  maxBorrowUserUsd,
  emode,
  denom,
}: {
  total_supplied: number;
  total_borrowed: number;
  price_usd: number;
  decimalFactor: number;
  supplyCap: string | null | undefined;
  borrowCap: string | null | undefined;
  userBalance: number;
  suppliedAmount: number;
  maxBorrowUserUsd: number;
  emode?: { group?: string; assets: { denom: string; borrowable: boolean }[] } | null;
  denom: string;
}) {
  const maxBorrowFromLiquidity = Math.max(0, totalSupplied - totalBorrowed - 0.01);
  const maxBorrowFromUserLtv = Math.max(0, (maxBorrowUserUsd / price) * decimalFactor);
  const maxBorrowFromBorrowCap = borrowCap ? Math.max(0, +borrowCap - totalBorrowed) : Infinity;
  const maxBorrowFromEmode =
    emode && !emode.assets.find((a) => a.denom === denom)?.borrowable ? 0 : Infinity;

  const maxBorrowTokens = Math.max(
    0,
    Math.min(
      maxBorrowFromLiquidity,
      maxBorrowFromUserLtv,
      maxBorrowFromBorrowCap,
      maxBorrowFromEmode,
    ),
  );
  const maxBorrowUsd = (maxBorrowTokens / decimalFactor) * price;

  const maxSupplyFromSupplyCap = supplyCap ? Math.max(0, +supplyCap - totalSupplied) : Infinity;
  const maxSupplyFromUserBalance = userBalance;
  const maxSupplyTokens = Math.min(maxSupplyFromSupplyCap, maxSupplyFromUserBalance);
  const maxSupplyUsd = (maxSupplyTokens / decimalFactor) * price;

  const maxWithdrawFromAvailableLiquidity = Math.max(0, totalSupplied - totalBorrowed - 10);
  const maxWithdrawFromSupplied = suppliedAmount;
  const maxWithdrawTokens = Math.min(maxWithdrawFromAvailableLiquidity, maxWithdrawFromSupplied);
  const maxWithdrawUsd = (maxWithdrawTokens / decimalFactor) * price;

  return {
    maxBorrowUsd,
    maxBorrowTokens,
    maxBorrowMessages: [
      maxBorrowFromUserLtv === 0 ? 'Insufficient collateral deposits' : null,
      maxBorrowFromLiquidity === 0 ? 'Insufficient market liquidity' : null,
      maxBorrowFromBorrowCap === 0 ? 'Reached borrow cap' : null,
      maxBorrowFromEmode === 0 && emode ? `Not borrowable in the E-Mode: ${emode?.group}` : null,
    ].filter(notEmpty),

    maxWithdrawTokens,
    maxWithdrawUsd,
    maxWithdrawMessages: [
      maxWithdrawFromAvailableLiquidity === 0 ? 'Insufficient market liquidity' : null,
      maxWithdrawFromSupplied === 0 ? 'No supplied assets' : null,
    ].filter(notEmpty),

    maxSupplyTokens,
    maxSupplyUsd,
    maxSupplyMessages: [
      maxSupplyFromSupplyCap === 0 ? 'Reached supply cap' : null,
      maxSupplyFromUserBalance === 0 ? 'Insufficient wallet balance' : null,
    ].filter(notEmpty),
  };
}

export const getAdditionalApys = async (chain: UseChainResult) => {
  const cacheTimeMin = 24 * 60; // 24 hours
  const results = await forkPromise({
    arbluna: chain.read.queryCached<{ apr: string }>(
      chain.config.contracts.arbluna,
      {
        exchange_rates: {
          limit: 30,
        },
      },
      cacheTimeMin,
    ),
    ampluna: chain.read.queryCached<{ apr: string }>(
      chain.config.contracts.ampluna,
      {
        exchange_rates: {
          limit: 7,
        },
      },
      cacheTimeMin,
    ),
    compounder: chain.read.queryCached<
      { apr: string; gauge: string; asset: AssetInfoBaseFor_Addr }[]
    >(
      chain.config.contracts.compounder,
      {
        exchange_rates: {
          limit: 2,
        },
      },
      cacheTimeMin,
    ),
    steth: globalCache.getCached('steth_apr', 24 * 60, () =>
      fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma')
        .then(async (a) => (await a.json()) as { data: { smaApr: number } })
        .then((data) => data.data.smaApr),
    ),
  });
  const arbluna = ASSET_META_LIST.find((a) => a.symbol === 'arbLUNA')!;
  const ampluna = ASSET_META_LIST.find((a) => a.symbol === 'ampLUNA')!;
  const steth = ASSET_META_LIST.find((a) => a.symbol === 'wstETH')!;

  const compounderDenoms = results.compounder.reduce<Record<string, number>>((acc, c) => {
    const existing = ASSET_META_LIST.find(
      (a) =>
        a.compounder &&
        a.compounder?.gauge === c.gauge &&
        getDenom(a.compounder.asset) === getDenom(c.asset),
    );
    if (existing) {
      acc[existing.denom] = aprToApy(+(c.apr ?? 0) * 365.25 * 100, 365.25) / 100;
    }
    return acc;
  }, {});

  return {
    [arbluna.denom]: aprToApy(+(results.arbluna?.apr ?? 0) * 365.25 * 100, 365.25) / 100,
    [ampluna.denom]: aprToApy(+(results.ampluna?.apr ?? 0) * 365.25 * 100, 365.25) / 100,
    [steth.denom]: aprToApy(+(results.steth ?? 0), 365.25) / 100,
    ...compounderDenoms,
  };
};

export const useCredaMetricsAddress = (
  options: {
    address?: string;
    ignore?: boolean;
    refresh?: number;
  } = {},
) => {
  const chain = useChain(Chain.Terra);
  const address = useAddress(chain.chainId);
  const usedAddress = options.address ?? address;

  return useAsyncSignal(async () => {
    if (!usedAddress) {
      return undefined;
    }

    if (options.ignore) {
      return undefined;
    }

    // await delay(200);
    // throw new Error('Something went wrong!');
    const r = chain.read;
    const { metrics, apys } = await forkPromise({
      metrics: r.query<Metrics>(chain.config.contracts.portfolio, <QueryMsgPortfolio>{
        metrics: {
          address: usedAddress || undefined,
        },
      }),
      apys: signalIncludeAssetApy.value
        ? getAdditionalApys(chain)
        : Promise.resolve({} as Record<string, number>),
    });
    const portfolio = metrics.portfolio!;
    const totalBorrowed = +portfolio.total_borrowed_value;
    const totalLtvValue = +portfolio.total_ltv_value;
    const borrowPowerUsed = totalLtvValue > 0 ? (totalBorrowed / totalLtvValue) * 100 : 0;
    const maxBorrowUserUsd = totalLtvValue * 0.995 - totalBorrowed;

    const emode = portfolio.emode && {
      ...portfolio.emode,
      assets: portfolio.emode.assets.map((a) => ({
        ...a,
        denom: getDenom(a.info),
      })),
    };

    const assets = metrics.assets.map((item) => {
      const denom = getDenom(item.info);
      const decimalInfo = getDecimalInfo(denom);
      const supplied = portfolio.supplied.find((a) => getDenom(a.info) === denom);
      const userBalance = +(item.user_wallet_balance ?? 0);

      const assetLimits = getAssetLimits({
        total_supplied: +(item.total_supplied || 0),
        total_borrowed: +(item.total_borrowed || 0),
        price_usd: +item.price!,
        decimalFactor: decimalInfo.factor,
        supplyCap: item.state.supply_cap,
        borrowCap: item.state.borrow_cap,
        userBalance,
        suppliedAmount: toNumb(supplied?.amount),
        maxBorrowUserUsd,
        emode,
        denom,
      });

      const supplyApys = getSupplyApys({
        apySupply: +item.supply_apy,
        apyAsset: apys[denom] || 0,
        utilization: +item.utilization,
        takerate: item.state.take_rate,
      });

      const borrowApys = getBorrowApys({
        apyBorrow: +item.borrow_apy,
        apyAsset: apys[denom] || 0,
      });

      return {
        ...item,
        denom,
        userBalance,
        decimalInfo,
        ...supplyApys,
        ...borrowApys,
        ...assetLimits,
      };
    });

    const supplied = portfolio.supplied.map((item) => {
      const denom = getDenom(item.info);
      const asset = assets.find((a) => a.denom === denom)!;

      return {
        ...item,
        denom,
        amount: toNumb(item.amount),
        value: toNumb(item.value),
        vamount: toNumb(item.vamount),
        asset: asset,
      };
    });

    return {
      ...metrics,
      portfolio: {
        ...portfolio,
        emode: emode,
        meta: {
          maxBorrowUsd: maxBorrowUserUsd,
          totalBorrowed,
          totalLtvValue,
          borrowPowerUsed,
        },
        borrowed: portfolio.borrowed.map((item) => {
          const denom = getDenom(item.info);
          return {
            ...item,
            denom,
            amount: toNumb(item.amount),
            value: toNumb(item.value),
            vamount: toNumb(item.vamount),
            asset: assets.find((a) => a.denom === denom)!,
          };
        }),
        supplied,
        collateral: supplied.filter((a) => a.collateral),
      },
      assets: assets,
    };
  }, [usedAddress, globalReload.value, signalIncludeAssetApy.value, options.refresh]);
};

function getTakeRate(utilization: number, take_rate: RateFunction | null | undefined): number {
  if (!take_rate) {
    return 0;
  }
  if (take_rate === 'none') {
    return 0;
  }

  if ('fixed' in take_rate) {
    return +take_rate.fixed;
  } else if ('curve' in take_rate) {
    const points = take_rate.curve;
    const sortedPoints = take(points, points.length).sort(
      (a, b) => +a.utilization - +b.utilization,
    );

    if (sortedPoints.length === 0) {
      return 0;
    }

    let previousPoint = sortedPoints[0];
    for (let i = 1; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      if (utilization < +point.utilization) {
        const utilizationDiff = +point.utilization - +previousPoint.utilization;
        if (utilizationDiff === 0) {
          return +previousPoint.rate;
        }
        const slope = (+point.rate - +previousPoint.rate) / utilizationDiff;
        return +previousPoint.rate + slope * (utilization - +previousPoint.utilization);
      }
      previousPoint = point;
    }

    // above highest point
    return +sortedPoints[sortedPoints.length - 1].rate;
  }

  return 0;
}

export const useCredaMetrics = () => {
  const chain = useChain(Chain.Terra);

  return useAsyncSignal(async () => {
    // await delay(5000);
    const { metrics, apys } = await forkPromise({
      metrics: chain.read.query<Metrics>(chain.config.contracts.portfolio, <QueryMsgPortfolio>{
        metrics: {},
      }),
      apys: signalIncludeAssetApy.value
        ? getAdditionalApys(chain)
        : Promise.resolve({} as Record<string, number>),
    });

    const assets = metrics.assets.map((item) => {
      const denom = getDenom(item.info);
      const decimalInfo = getDecimalInfo(denom);
      const supplyApys = getSupplyApys({
        apySupply: +item.supply_apy,
        apyAsset: apys[denom] || 0,
        utilization: +item.utilization,
        takerate: item.state.take_rate,
      });

      const borrowApys = getBorrowApys({
        apyBorrow: +item.borrow_apy,
        apyAsset: apys[denom] || 0,
      });

      const total_supplied = toNumb(item.total_supplied);
      const uborrow_cap =
        item.state.borrow_cap === null
          ? total_supplied
          : Math.min(total_supplied, toNumb(item.state.borrow_cap));

      const canBeBorrowed = item.state.borrow_cap === null || toNumb(item.state.borrow_cap) > 0;

      const borrow_cap = uborrow_cap / decimalInfo.factor;

      return {
        ...item,
        isBorrowDisallowed: item.state.borrow_cap === '0' && item.total_borrowed === '0',
        denom,
        decimalInfo,
        ...supplyApys,
        ...borrowApys,

        additions: {
          canBeBorrowed,
          total_supplied,
          borrow_cap,
          uborrow_cap,
        },
      };
    });

    return {
      ...metrics,
      assets,
    };
  }, [globalReload.value, signalIncludeAssetApy.value]);
};

export const useCredaMetricAsset = (denom: string) => {
  const chain = useChain(Chain.Terra);
  const address = useAddress(chain.chainId);

  return useAsyncSignal(async () => {
    const decimalInfo = getDecimalInfo(denom);
    const info = getAssetInfo(denom);
    const r = chain.read;

    const data = await forkPromise({
      metric: r.query<MetricResponse>(chain.config.contracts.portfolio, <QueryMsgPortfolio>{
        metric: {
          asset_info: info,
          address: address || undefined,
        },
      }),
      apys: signalIncludeAssetApy.value
        ? getAdditionalApys(chain)
        : Promise.resolve({} as Record<string, number>),
    });
    const asset_metrics = data.metric.asset;
    const portfolio = data.metric.portfolio;
    const price_usd = toNumb(asset_metrics.price);

    const decimalFactor = decimalInfo.factor;

    const utilization = +asset_metrics.utilization;

    const interestCurveData = prepareInterestCurveData(asset_metrics.state.borrow_rates, 0.001);

    const total_borrowed = toNumb(asset_metrics.total_borrowed);
    const total_supplied = toNumb(asset_metrics.total_supplied);
    const borrow_cap =
      asset_metrics.state.borrow_cap === null
        ? total_supplied
        : Math.min(total_supplied, toNumb(asset_metrics.state.borrow_cap));

    const supply_cap = toNumb(asset_metrics.state.supply_cap);

    const numericMetrics = {
      total_borrowed_actual: total_borrowed / decimalFactor,
      total_supplied_actual: total_supplied / decimalFactor,
      borrow_cap_actual: borrow_cap / decimalFactor,
      supply_cap_actual: supply_cap / decimalFactor,
      borrow_cap_usd: (borrow_cap / decimalFactor) * price_usd,
      supply_cap_usd: (supply_cap / decimalFactor) * price_usd,
      total_available_usd:
        (total_supplied / decimalFactor - total_borrowed / decimalFactor) * price_usd,
      total_supplied_usd: toNumb(asset_metrics.total_supplied_usd),
      total_borrowed_usd: toNumb(asset_metrics.total_borrowed_usd),
      utilization,
    };

    const emode =
      portfolio && portfolio.emode
        ? {
            ...portfolio.emode,
            assets: portfolio.emode.assets.map((a) => ({
              ...a,
              denom: getDenom(a.info),
            })),
          }
        : null;
    const totalBorrowed = toNumb(portfolio?.total_borrowed_value);
    const totalLtvValue = toNumb(portfolio?.total_ltv_value);
    const maxBorrowUserUsd = totalLtvValue * 0.995 - totalBorrowed;
    const borrowPowerUsed = totalLtvValue > 0 ? (totalBorrowed / totalLtvValue) * 100 : 0;
    const suppliedItem = portfolio?.supplied.find((s) => getDenom(s.info) === denom);
    const userBalance = +(asset_metrics.user_wallet_balance ?? 0);

    // Calculate asset limits if portfolio data is available (wallet connected)
    let assetLimits: ReturnType<typeof getAssetLimits> | object = {};
    if (portfolio) {
      assetLimits = getAssetLimits({
        total_supplied,
        total_borrowed,
        price_usd,
        decimalFactor,
        supplyCap: asset_metrics.state.supply_cap,
        borrowCap: asset_metrics.state.borrow_cap,
        userBalance,
        suppliedAmount: toNumb(suppliedItem?.amount),
        maxBorrowUserUsd,
        emode,
        denom,
      });
    }

    const supplyApys = getSupplyApys({
      apySupply: +asset_metrics.supply_apy,
      apyAsset: data.apys[denom] || 0,
      utilization: utilization,
      takerate: asset_metrics.state.take_rate,
    });

    const borrowApys = getBorrowApys({
      apyBorrow: +asset_metrics.borrow_apy,
      apyAsset: data.apys[denom] || 0,
    });

    const supplied = portfolio?.supplied.map((item) => {
      const denom = getDenom(item.info);
      return {
        ...item,
        denom,
        amount: toNumb(item.amount),
        value: toNumb(item.value),
        vamount: toNumb(item.vamount),
      };
    });

    return {
      price: price_usd,
      asset_metrics: {
        denom,
        decimalInfo,

        isBorrowDisallowed:
          asset_metrics.state.borrow_cap === '0' && asset_metrics.total_borrowed === '0',
        collateral: portfolio
          ? portfolio.supplied.some((s) => getDenom(s.info) === denom && s.collateral)
          : false,
        userBalance: toNumb(asset_metrics.user_wallet_balance),
        ...asset_metrics,
        ...supplyApys,
        ...borrowApys,
        ...numericMetrics,
        ...assetLimits,
      },
      portfolio: portfolio && {
        ...portfolio,
        emode: emode,
        meta: {
          maxBorrowUsd: maxBorrowUserUsd,
          totalBorrowed,
          totalLtvValue,
          borrowPowerUsed,
        },
        borrowed: portfolio?.borrowed.map((item) => {
          const denom = getDenom(item.info);
          return {
            ...item,
            denom,
            amount: toNumb(item.amount),
            value: toNumb(item.value),
            vamount: toNumb(item.vamount),
          };
        }),
        supplied,
        collateral: supplied?.filter((a) => a.collateral),
      },
      interest_curve_data: interestCurveData,
    };
  }, [globalReload.value, denom, signalIncludeAssetApy.value, address]);
};

export const useCredaEmodes = () => {
  const chain = useChain(Chain.Terra);

  return useAsyncSignal(async () => {
    return await chain.read.queryCached<EmodeGroup[]>(
      chain.config.contracts.portfolio,
      <QueryMsgPortfolio>{
        all_emode_groups: {},
      },
      60,
    );
  }, [globalReload.value]);
};

export const useCredaState = () => {
  const chain = useChain(Chain.Terra);

  return useAsyncSignal(async () => {
    return await chain.read.queryCached<StateResponse>(
      chain.config.contracts.portfolio,
      <QueryMsgPortfolio>{
        state: {},
      },
      60 * 8,
    );
  }, [globalReload.value]);
};

export const useAssetEmodes = (denom: string) => {
  const chain = useChain(Chain.Terra);

  return useAsyncSignal(async () => {
    const emodes = await chain.read.queryCached<EmodeGroup[]>(
      chain.config.contracts.portfolio,
      <QueryMsgPortfolio>{
        all_emode_groups: {},
      },
      60,
    );

    const assetEmodes = emodes.filter((group) =>
      group.assets.some((asset) => {
        return getDenom(asset.info) === denom;
      }),
    );

    const perGroup = assetEmodes.map((group) => {
      const asset = group.assets.find((a) => {
        return getDenom(a.info) === denom;
      });
      return {
        group: group.group,
        collateral: asset?.collateral ?? false,
        borrowable: asset?.borrowable ?? false,
      };
    });

    return {
      assetEmodes,
      perGroup,
    };
  }, [globalReload.value, denom]);
};

type InterestCurveResult = {
  data: { x: number; rate: number }[];
  optimum: number | undefined;
  optimumAmount: number | undefined;
};

export function prepareInterestCurveData(data: RatePoint[], stepSize: number): InterestCurveResult {
  if (!data.length) return { data: [], optimum: undefined, optimumAmount: undefined };
  const normalizedPoints = data
    .map((point) => ({
      x: toNumb(point.utilization),
      y: toNumb(point.rate),
    }))
    .sort((a, b) => a.x - b.x);

  const optimumPoint = normalizedPoints[1] ?? normalizedPoints[0];
  const optimum = optimumPoint.x;
  const optimumAmount = optimumPoint.y;

  if (normalizedPoints.length === 1) {
    const p = normalizedPoints[0];
    return { data: [{ x: p.x, rate: p.y }], optimum, optimumAmount };
  }

  const interpolated: { x: number; rate: number }[] = [];

  for (let i = 0; i < normalizedPoints.length - 1; i++) {
    const startPoint = normalizedPoints[i];
    const endPoint = normalizedPoints[i + 1];

    const segment = interpolateBetweenTwoPoints(startPoint, endPoint, stepSize);
    const segmentPoints = i === 0 ? segment : segment.slice(1);

    for (const pt of segmentPoints) {
      interpolated.push({ x: pt.x, rate: pt.y });
    }
  }

  return { data: interpolated, optimum, optimumAmount };
}
