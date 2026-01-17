import { globalConfig } from '@/config/config';
import { ShuttleContextType } from '@/delphi-labs/shuttle-react';
import { Chain } from '@/hooks/helpers/assets';
import { fromBech32 } from '@cosmjs/encoding';
import { isEmpty, isObject, upperFirst } from 'lodash-es';
import numeral from 'numeral';
import { ReactNode } from 'react';
import { AssetInfoBaseFor_Addr, getDecimalInfo } from './asset-helpers';

export const notEmpty = <TValue>(value: TValue | null | undefined): value is TValue => {
  return value !== null && value !== undefined;
};

export const notFalsy = <TValue>(
  value: TValue | null | undefined | false | 0 | '',
): value is TValue => {
  return !!value;
};

export const trimCharacter = (str: string, charToRemove: string): string => {
  const escapedChar = charToRemove.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape special regex characters
  const regex = new RegExp(`^${escapedChar}+|${escapedChar}+$`, 'g');
  return str.replace(regex, '');
};

export function base64Encode(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64');
}

export const getAssetInfo = (denom: string) => {
  if (denom.startsWith('cw20:') || denom.startsWith('native:')) {
    denom = denom.substring(denom.indexOf(':') + 1);
  }
  if (denom.startsWith('u') || denom.startsWith('factory/') || denom.startsWith('ibc/')) {
    return {
      native: denom,
    } as AssetInfoBaseFor_Addr;
  }
  return {
    cw20: denom,
  } as AssetInfoBaseFor_Addr;
};

export const getErrorMessage = async (error: any) => {
  // if (error instanceof ResponseError) {
  //   const response = await error.response.clone().json();
  //   return response.message;
  // }
  return getErrorMessageSync(error);
};

export const getErrorMessageSync = (error: any) => {
  if (error?.error) {
    return prepareMessage(error.error);
  }
  if (error instanceof Error) {
    return prepareMessage(error.message);
  }
  if (typeof error === 'string') {
    return prepareMessage(error);
  }
  if (error?.message) {
    return prepareMessage(error.message);
  }
  return JSON.stringify(error);
};
function prepareMessage(
  error: string,
  allAssets?: { symbol: string; display: string; base: string }[],
): string {
  const replacements: [string, string][] = [
    [
      'Query failed with (6): rpc error: code = Unknown desc = failed to execute message; message index: 0: ',
      '',
    ],
    ['Query failed with (6): rpc error: code = Unknown desc = ', ''],
    ['Query failed with (6): ', ''],
    ['dispatch: submessages: ', ''],
    ['failed to execute message;', ''],
    ['message index: 0: ', ''],
    ['message index: 1: ', ''],
    ['message index: 2: ', ''],
    ['message index: 3: ', ''],
    ['message index: 4: ', ''],
    ['message index: 5: ', ''],
    ['message index: 6: ', ''],
    ['message index: 7: ', ''],
    ['message index: 8: ', ''],
    ['message index: 9: ', ''],
    ['message index: 10: ', ''],
    ['Generic error: ', ''],
  ];

  for (const asset of allAssets ?? []) {
    replacements.push([asset.base, ' ' + (asset.display?.toUpperCase() || asset.symbol)]);
  }

  for (const [search, replace] of replacements) {
    error = replaceAll(error, search, replace);
  }
  error = replaceDecimals(error);
  error = replaceLargeNumbers(error);
  error = replaceNewDenoms(error);
  error = replaceEnd(error);
  error = replaceJsonObjectEnd(error);
  return error;
}

function replaceEnd(error: string) {
  const endRemovals = [
    ': execute wasm contract failed',
    '[cosmos/cosmos-sdk@v0.47.15/x/bank/keeper/send.go:252]',
    '[cosmos/cosmos-sdk@v0.50.11/x/bank/keeper/send.go:',
    '[CosmWasm/wasmd@v0.53.0/x/wasm/types/tx.go:128]',
    '[CosmWasm/wasmd@v0.53.2/x/wasm/types/tx.go:128]',
    '[CosmWasm/wasmd@v0.54.1/x/wasm/types/tx.go:125]',
    ': query wasm contract failed: unknown request',
  ];
  for (const removal of endRemovals) {
    const index = error.indexOf(removal);
    if (index >= 0) {
      error = error.substring(0, index);
    }
  }
  return error;
}

export function replaceJsonObjectEnd(error: string): string {
  if (!error.trim().endsWith('}')) {
    return error;
  }
  const lastBraceIndex = error.indexOf('{');
  return error.slice(0, lastBraceIndex).replace(/[:\s]+$/, '');
}

export function tryGetJsonObjectEnd(error: string) {
  error = replaceEnd(error);

  if (!error.trim().endsWith('}')) {
    return undefined;
  }
  const lastBraceIndex = error.indexOf('{');
  const errorData = error.slice(lastBraceIndex);
  let data: any | undefined;
  try {
    data = JSON.parse(errorData);
  } catch (error) {
    console.log('Failed to parse error data JSON', error, errorData);
  }
  // also trim : from end
  return data;
}

export function replaceDecimals(input: string): string {
  const regex = /(^|\s)(\d+)([a-zA-Z][a-zA-Z0-9/]+)/g;

  return input.replace(regex, (match, prefix, amountStr, currency) => {
    const decimal = getDecimalInfo(currency);
    if (!decimal) {
      return match; // leave unchanged if not a known currency
    }
    const amount = parseInt(amountStr, 10);
    const rendered = decimal.renderu(amount);
    return (prefix ?? '') + rendered; // Keep the space or start
  });
}

function replaceNewDenoms(input: string): string {
  const regex = /(native|cw20):([a-zA-Z0-9/]+)/g;

  return input.replace(regex, (match, _type: any, tokenId) => {
    const decimal = getDecimalInfo(tokenId);
    if (!decimal) {
      return match; // leave unchanged if not a known currency
    }
    return decimal.display;
  });
}

export function replaceAll(input: string, search: string, replacement: string): string {
  // Use a regular expression with the global flag to replace all occurrences
  const escapedSearch = search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); // Escape special characters
  const regex = new RegExp(escapedSearch, 'g');
  return input.replace(regex, replacement);
}

export function replaceLargeNumbers(input: string): string {
  return input.replace(/\b\d+\b/g, (match) => {
    const number = parseInt(match, 10);
    if (number > 100000) {
      return (number / 1e6).toString();
    }
    return match; // Return the number as-is if it's <= 100000
  });
}

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export class DeferredPromise<T> {
  public promise: Promise<T>;
  public reject: (reason?: any) => void;
  public resolve: (value?: T | any) => void;

  constructor() {
    this.reject = () => {};
    this.resolve = () => {};
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

export const createLink = (
  link: string | undefined,
  replacements: Record<string | number, string | number | undefined>,
) => {
  if (!link) {
    return '';
  }

  for (const key in replacements) {
    const value = replacements[key];
    if (value && (typeof value === 'number' || typeof value === 'string')) {
      link = link.replace('{' + key + '}', encodeURIComponent(value.toString()));
    }
  }
  return link;
};

const index = 0;
export const timed = async <T>(name: string, callback: () => Promise<T>): Promise<T> => {
  const fullname = `${name} ${index}`;
  try {
    console.time(fullname);
    return await callback();
  } finally {
    console.timeEnd(fullname);
  }
};

export type ExtractParams<T extends string> = T extends `${infer _}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractParams<Rest>]: string }
  : T extends `${infer _}:${infer Param}`
  ? { [K in Param]: string }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {};

export const toNumb = (val: number | string | undefined | null, def = 0) => {
  return +(val ?? def);
};
export const formatToken = (
  val: number | string | undefined | null,
  options: { divisor?: number; decimals?: number; roundUp?: boolean } = {},
) => {
  let valueNumb = toNumb(val) / (options.divisor ?? 1);

  if (options.roundUp && options.decimals) {
    const factor = Math.pow(10, options.decimals);
    valueNumb = Math.ceil(valueNumb * factor) / factor;
  }

  const decimals = Math.min(6, options.decimals ?? 0);
  const pattern = '00[' + '0'.repeat(Math.max(0, decimals - 2)) + ']';

  if (valueNumb < 1e-6 && valueNumb !== 0) {
    return '<' + numeral(0.000001).format(`0,0.${pattern}`);
  }

  return numeral(valueNumb).format(`0,0.${pattern}`);
};

export const getDenom = (asset: AssetInfoBaseFor_Addr) => {
  if ('cw20' in asset) {
    return asset.cw20;
  } else {
    return asset.native;
  }
};

export const selectMany = <T, U>(array: T[], selector: (x: T) => U[]): Array<U> => {
  const result = array.map((x) => selector(x));
  if (!result.length) {
    return [];
  }
  return result.reduce((a, b) => a.concat(b));
};

export async function awaitObject<T extends Record<string, Promise<any>>>(
  obj: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const entries = Object.entries(obj); // Convert object to array of [key, promise]
  const keys = entries.map(([key]) => key); // Extract keys
  const values = await Promise.all(entries.map(([_, promise]) => promise)); // Await all promises

  return Object.fromEntries(keys.map((key, i) => [key, values[i]])) as {
    [K in keyof T]: Awaited<T[K]>;
  };
}

export const getPercent = (val: number | null | undefined, total: number | null | undefined) => {
  const valInternal = toNumb(val);
  const totalInternal = toNumb(total);
  if (!totalInternal) {
    return '0.00%';
  }
  return ((valInternal / totalInternal) * 100).toFixed(2) + '%';
};

export function clean<T>(obj: T): T {
  for (const propName in obj) {
    const value = (obj as any)[propName];

    if (isObject(value)) {
      clean(value);
    }

    if (
      !notFalsy(value) ||
      value === null ||
      value === undefined ||
      (isObject(value) && isEmpty(value))
    ) {
      delete (obj as any)[propName];
    }
  }

  return obj;
}

function isFalsy(value: any): boolean {
  return value === false || value === null || value === undefined || value === 0 || value === '';
}

export function isDirty(
  obj1: Record<string, any>,
  obj2: Record<string, any>,
  ignoreKeys: string[] = [],
): boolean {
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of keys) {
    if (ignoreKeys.includes(key)) continue;

    let val1 = obj1[key];
    let val2 = obj2[key];

    if (isFalsy(val1) && isFalsy(val2)) continue;

    if (isObject(val1) && isFalsy(val2)) {
      val2 = {};
    }
    if (isFalsy(val1) && isObject(val2)) {
      val1 = {};
    }

    const areObjects = isObject(val1) && isObject(val2);
    if (areObjects) {
      if (isDirty(val1, val2, ignoreKeys)) return true;
    } else if (val1 !== val2) {
      return true;
    }
  }

  return false;
}

export function isHash(input: string): boolean {
  const hex64Regex = /^[A-Fa-f0-9]{64}$/;
  return hex64Regex.test(input);
}

export function reactNodeToText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return node.toString();
  }

  if (Array.isArray(node)) {
    return node.map(reactNodeToText).join('');
  }

  if (node && typeof node === 'object' && 'props' in node) {
    return reactNodeToText((node as any).props.children);
  }

  return '';
}

export function getErrorType(errorMsg: string): string {
  const msg = errorMsg.toLowerCase();

  if (msg.includes('insufficient funds') || msg.includes('spendable balance')) {
    return 'Insufficient Funds';
  }

  if (msg.includes('out of gas') || msg.includes('gas wanted') || msg.includes('gas limit')) {
    return 'Out of Gas';
  }

  if (msg.includes('invalid address')) {
    return 'Invalid Address';
  }

  if (msg.includes('account sequence mismatch') || msg.includes('incorrect account sequence')) {
    return 'Sequence Mismatch';
  }

  if (msg.includes('unknown denom') || msg.includes('no metadata found')) {
    return 'Denom not found';
  }

  if (msg.includes('unauthorized') || msg.includes('not authorized')) {
    return 'Unauthorized';
  }

  return 'Unknown';
}

export function getErrorInformationMessage(errorMsg: string): string {
  const msg = errorMsg.toLowerCase();

  if (msg.includes('insufficient funds') || msg.includes('spendable balance')) {
    return 'Your wallet lacks the necessary funds to perform this action. ' + upperFirst(errorMsg);
  }

  return errorMsg;
}

export function getUnixTimestampInNanoseconds(futureMinutes: number): bigint {
  const currentTimeMillis = Date.now(); // Current time in milliseconds
  const futureTimeMillis = currentTimeMillis + futureMinutes * 60 * 1000; // Add 5 minutes in milliseconds
  const futureTimeNanos = BigInt(futureTimeMillis) * BigInt(1_000_000); // Convert to nanoseconds
  return futureTimeNanos;
}

export const trim = (text: string, len = 4) => {
  if (text.length < 10) {
    return text;
  }
  return text.substring(0, len) + '...' + text.substring(text.length - len);
};

export const areNumbersClose = (num1: number, num2: number, tolerance: number = 0.01): boolean => {
  return Math.abs(num1 - num2) <= tolerance;
};

export const isCw20 = (denom: string) => {
  return denom.startsWith('terra');
};
export const getAssetInfoOld = (denom: string) => {
  if (isCw20(denom)) {
    return {
      token: {
        contract_addr: denom,
      },
    };
  } else {
    return {
      native_token: {
        denom,
      },
    };
  }
};

export const toUnixS = (date?: Date) => {
  if (!date) {
    throw new TypeError('Date required');
  }
  if (!(date instanceof Date)) {
    throw new TypeError('Input must be a Date object');
  }
  return Math.floor(date.getTime() / 1000);
};

export const fromUnixS = (date_s?: number) => {
  if (!date_s) {
    throw new TypeError('Unix required');
  }
  return new Date(date_s * 1000);
};

export const fromUnixNano = (date_nano?: number) => {
  if (!date_nano) {
    throw new TypeError('Unix required');
  }
  return new Date(date_nano / 1000 / 1000);
};

export const toArray = <T>(element: T | T[]) => {
  if (element instanceof Array) {
    return element;
  } else {
    return [element].filter(notEmpty);
  }
};

export const getWallet = (shuttle: ShuttleContextType, chain: Chain) => {
  const wallet = shuttle.wallets.find((a) => a.network.chainId === chain);
  if (!wallet) {
    throw new Error(`Chain doesnt have wallet connected: ${chain}`);
  }
  return wallet;
};

export function removeAfterQuestionMark(str: string) {
  return str.split('?')[0];
}
export function removeAfterDot(str: string) {
  return str.split('.')[0];
}

type Item = { value: string };
type Structure = { items: Item[] }[];

export function removeDuplicatesById<T extends Structure>(structure: T): T {
  const seenIds = new Set<string>();
  return structure?.map(({ items, ...rest }) => ({
    ...rest,
    items: items?.filter((item) => {
      if (seenIds.has(item.value)) {
        return false;
      }
      seenIds.add(item.value);
      return true;
    }),
  })) as T;
}

export async function copyImg(src: string, fallback: string) {
  let img: Response;

  try {
    img = await fetch(src, {});
  } catch (error) {
    if (!fallback) {
      throw error;
    }
    img = await fetch(fallback);
  }
  // console.log('headers', img.headers);
  const imgBlob = await img.blob();
  try {
    navigator.clipboard.write([
      new ClipboardItem({
        'image/png': imgBlob, // change image type accordingly
      }),
    ]);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Validates if an address is a valid Bech32 address with a specific prefix and length.
 * @param address - The address to validate.
 * @param prefix - The required Bech32 prefix (e.g., 'terra').
 * @returns True if the address is valid, false otherwise.
 */
export function isValidCosmWasmAddress(address: string, prefix: string): boolean {
  try {
    const { prefix: decodedPrefix } = fromBech32(address);
    // console.log('decode', address, decodedPrefix, prefix);
    return decodedPrefix === prefix; // 20 bytes for standard CosmWasm addresses
  } catch (e: unknown) {
    // console.log('error during decode', address, e);
    return false; // Invalid Bech32 format
  }
}

export class ExtendedError extends Error {
  constructor(message: string, public title: string) {
    super(message);
  }
}

export async function forkPromise<T extends Record<string, Promise<any>>>(
  element: T,
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const entries = Object.entries(element) as [keyof T, Promise<any>][];
  const results = await Promise.all(entries.map(([, p]) => p));
  return entries.reduce((acc, [key], i) => {
    acc[key] = results[i];
    return acc;
  }, {} as { [K in keyof T]: Awaited<T[K]> });
}

export function downloadBase64File(base64: string, fileName: string, mimeType: string) {
  // Create blob and download
  const blob = base64toBlob(base64, mimeType);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style = 'display: none';
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function base64toBlob(base64Data: string, contentType: string) {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = atob(base64Data);
  const bytesLength = byteCharacters.length;
  const slicesCount = Math.ceil(bytesLength / sliceSize);
  const byteArrays = new Array(slicesCount);

  for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize;
    const end = Math.min(begin + sliceSize, bytesLength);

    const bytes = new Array(end - begin);
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

export const DAYS_IN_YEAR = 365.25;
const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
const BLOCKS_IN_A_YEAR = SECONDS_PER_YEAR / 6;

/**
 * Formula source: http://www.linked8.com/blog/158-apy-to-apr-and-apr-to-apy-calculation-methodologies
 *
 * @param interest {Number} APY as percentage (ie. 6)
 * @param frequency {Number} Compounding frequency (times a year)
 * @returns {Number} APR as percentage (ie. 5.82 for APY of 6%)
 */
export const apyToApr = (interest: number, frequency = DAYS_IN_YEAR) =>
  ((1 + interest / 100) ** (1 / frequency) - 1) * frequency * 100;

/**
 * Formula source: http://www.linked8.com/blog/158-apy-to-apr-and-apr-to-apy-calculation-methodologies
 *
 * @param interest {Number} APR as percentage (ie. 5.82)
 * @param frequency {Number} Compounding frequency (times a year)
 * @returns {Number} APY as percentage (ie. 6 for APR of 5.82%)
 */
export const aprToApy = (interest: number, frequency = DAYS_IN_YEAR) =>
  ((1 + interest / 100 / frequency) ** frequency - 1) * 100;

export function interpolateBetweenTwoPoints(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  stepSize: number,
): { x: number; y: number }[] {
  const interpolatedPoints: { x: number; y: number }[] = [];
  interpolatedPoints.push({ x: startPoint.x, y: startPoint.y });

  const deltaX = endPoint.x - startPoint.x;
  if (deltaX === 0) return interpolatedPoints;

  for (
    let currentX = startPoint.x + stepSize;
    currentX < endPoint.x - 1e-12;
    currentX += stepSize
  ) {
    const interpolationFactor = (currentX - startPoint.x) / deltaX;
    const interpolatedY = startPoint.y + interpolationFactor * (endPoint.y - startPoint.y);
    interpolatedPoints.push({ x: currentX, y: interpolatedY });
  }
  interpolatedPoints.push({ x: endPoint.x, y: endPoint.y });

  return interpolatedPoints;
}

export const getIpfsLink = (ipfs: string | null | undefined, sourceSize: 0 | 160 | 440) => {
  // console.log('creating link', ipfs);
  // if (ipfs?.startsWith('https://ipfs.io/ipfs')) {
  //   return {
  //     src: ipfs,
  //   };
  // }

  const cid =
    ipfs?.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '').replace('https://', '') ?? '';

  const cidWithoutExtension = removeAfterDot(cid);

  if (!cidWithoutExtension || !cid) {
    return {};
  }

  return {
    src: `${globalConfig.cdnEndpoint}/ipfs/${cidWithoutExtension?.replace('/', '_')}_${sourceSize}`,
    fallbackSrc: `${globalConfig.nftEndpoint}/api/ipfs/${encodeURIComponent(cid ?? '')}`,
  };
};

export const EMPTY_PUB_KEY = new Uint8Array([0x02, ...[...new Array(32)].map(() => 0)]);
