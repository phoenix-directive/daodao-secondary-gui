import {
  CosmiframeExtensionProvider,
  KeplrExtensionProvider,
  KeplrMobileProvider,
  LeapCosmosExtensionProvider,
} from '@/delphi-labs/shuttle-react';
import { notFalsy } from '@/hooks/helpers/helpers';
import { ReadonlyWalletProvider } from '@/wallet/ReadonlyWalletProvider';
import { TERRA } from './chains';

const networks = [TERRA];

const inIframe = window.self !== window.top;
export const keplrProvider =
  !inIframe &&
  // window.keplr &&
  new KeplrExtensionProvider({
    networks,
  });

export const leapProvider =
  !inIframe &&
  // window.leap &&
  new LeapCosmosExtensionProvider({
    networks,
  });

// console.log("in iframe", inIframe);
export const cosmiProvider =
  inIframe &&
  new CosmiframeExtensionProvider({
    networks,
    allowedParentOrigins: ['https://daodao.zone', 'https://dao.daodao.zone'],
  });

export const readonlyProvider = !inIframe && new ReadonlyWalletProvider({ networks });

export const extensionProviders = [
  keplrProvider,
  leapProvider,
  cosmiProvider,
  readonlyProvider,
].filter(notFalsy);

export const mobileProviders = [
  !inIframe &&
    new KeplrMobileProvider({
      networks,
      walletConnectProjectId: 'd8bb9617d17922bfcd43ddb48eeb77a6',
    }),
].filter(notFalsy);
