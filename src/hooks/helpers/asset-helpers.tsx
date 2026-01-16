import { AssetMeta, getAssetMeta } from '@/config/assets';
import { MsgExecuteContract } from '@/delphi-labs/shuttle';
import { allAssets } from '@/hooks/helpers/assets';
import { formatToken, getDenom, isCw20 } from '@/hooks/helpers/helpers';
import { ReactElement } from 'react';

export interface AssetBaseFor_Addr {
  /**
   * Specifies the asset's amount
   */
  amount: Uint128;
  /**
   * Specifies the asset's type (CW20 or native)
   */
  info: AssetInfoBaseFor_Addr;
}
export type Uint128 = string;
export type Addr = string;

/**
 * Represents the type of an fungible asset.
 *
 * Each **asset info** instance can be one of three variants:
 *
 * - Native SDK coins. To create an **asset info** instance of this type, provide the denomination. - CW20 tokens. To create an **asset info** instance of this type, provide the contract address.
 */
export type AssetInfoBaseFor_Addr =
  | {
      native: string;
    }
  | {
      cw20: Addr;
    };

export interface DecimalInfo {
  icon?: string;
  decimals: number;
  formatDecimals: number;
  factor: number;
  display: string;
  denom: string;
  meta: AssetMeta;
  format: (val?: number | string | null, options?: Options) => string;
  formatu: (val?: number | string | null, options?: Options) => string;
  formatFull: (val?: number | string | null, options?: Options) => string;
  formatuFull: (val?: number | string | null, options?: Options) => string;
  render: (val?: number | string | null) => string;
  renderu: (val?: number | string | null) => string;
  renderFull: (val?: number | string | null) => string;
  renderuFull: (val?: number | string | null) => string;
  renderGroup: (val?: number | string | null) => ReactElement;
  renderuGroup: (val?: number | string | null) => ReactElement;
  roundByFormat: (val: number) => number;
}

interface Options {
  decimals?: number;
  useFullDecimals?: boolean;
}

// export function getDecimalInfoFromPrice(price?: Price | null) {
//   return getDecimalInfo(price?.denom ?? '');
// }

const indexed: Record<string, DecimalInfo> = {};

export function getDecimalInfo(denom: string) {
  const asset = getAssetMeta(denom);

  if (indexed[denom]) {
    return indexed[denom];
  }

  const decimals = asset.decimals ?? 6;
  const factor = Math.pow(10, decimals);
  const lastSlash = denom.lastIndexOf('/');
  const fallbackDisplay = lastSlash >= 0 ? denom.substring(lastSlash + 1) : denom;
  let display = asset?.symbol ?? fallbackDisplay;

  if (display.toLowerCase() === display) {
    display = display.toUpperCase();
  }
  const getFormatDecimals = () => {
    let decimals = 6;
    if (display === 'ASTRO' || display === 'xASTRO') {
      decimals = 3;
    }
    if (display === 'NTRN') {
      decimals = 3;
    }
    if (display === 'ATOM') {
      decimals = 3;
    }
    if (display === 'USDC') {
      decimals = 2;
    }
    return decimals;
  };
  const formatDecimals = getFormatDecimals();
  const format = (amount?: number | string | null, options?: Options) => {
    let internalDecimals = options?.decimals ?? formatDecimals;
    if (options?.useFullDecimals) {
      internalDecimals = decimals;
    }

    return formatToken(amount ?? 0, { decimals: internalDecimals });
  };

  const formatu = (a?: number | string | null, options?: Options) =>
    format(+(a ?? 0) / factor, options);

  //   const renderGroup = (a?: number | string | null) => {
  //     return <ValueGroup value={format(a)} suffix={display}></ValueGroup>;
  //   };
  //   const renderuGroup = (a?: number | string | null) => {
  //     return <ValueGroup value={formatu(a)} suffix={display}></ValueGroup>;
  //   };

  const result = {
    denom,
    decimals,
    formatDecimals,
    factor,
    display,
    meta: asset,
    icon: asset?.icon,
    format: format,
    formatu: formatu,
    render: (a) => format(a) + ' ' + display,
    renderu: (a) => formatu(a) + ' ' + display,
    renderFull: (a) => format(a, { useFullDecimals: true }) + ' ' + display,
    renderuFull: (a) => formatu(a, { useFullDecimals: true }) + ' ' + display,
    formatFull: (a?: number | string | null, options?: Options) => {
      return format(a, { ...options, useFullDecimals: true });
    },
    formatuFull: (a?: number | string | null, options?: Options) => {
      return formatu(a, { ...options, useFullDecimals: true });
    },
    // renderGroup,
    // renderuGroup,
    roundByFormat: (val) =>
      Math.floor(val * Math.pow(10, formatDecimals)) / Math.pow(10, formatDecimals),
  } as DecimalInfo;
  indexed[denom] = result;
  return result;
}

export const getIcon = (denom: string) => {
  const asset = allAssets.find((a) => a.base === denom);
  const icon = asset?.logoURIs?.svg ?? asset?.logoURIs?.png;
  return icon;
};

// export const getDecimalInfoBySymbol = (chain: Chain, symbol: string) => {
//   symbol = symbol.toLowerCase();
//   const asset = allAssets.find((a) => a.display.toLowerCase() === symbol && a.chain === chain);
//   if (!asset) {
//     throw new Error(`Asset not found display/symbol: ${symbol}`);
//   }

//   return getDecimalInfo(asset.base, asset);
// };

export const roundDecimalsByInfo = (amount: number, info: DecimalInfo) => {
  return roundDecimals(amount, info.factor);
};

export const roundDecimals = (amount: number, factor: number) => {
  return Math.floor(factor * amount) / factor;
};

export function renderAsset(asset: AssetBaseFor_Addr | undefined) {
  if (!asset) return '-';
  return getDecimalInfo(getDenom(asset.info)).renderu(asset.amount);
}

export function sendOrExecute<T>(
  sender: string,
  contract: string,
  amount: number,
  denom: string,
  execute_msg: T,
): MsgExecuteContract {
  const amountFix = amount.toFixed(0);
  if (isCw20(denom)) {
    return new MsgExecuteContract({
      contract: denom,
      msg: {
        send: {
          contract: contract,
          amount: amountFix,
          msg: btoa(JSON.stringify(execute_msg)),
        },
      },
      sender,
    });
  } else {
    return new MsgExecuteContract({
      contract: contract,
      msg: execute_msg,
      funds: [
        {
          denom: denom,
          amount: amountFix,
        },
      ],
      sender,
    });
  }
}
