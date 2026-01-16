import { Cosmiframe } from '@dao-dao/cosmiframe';
import { Keplr, KeplrWindow } from '../../internals';
import type { Network } from '../../internals/network';
import WalletExtensionProvider from './WalletExtensionProvider';

export const CosmiframeExtensionProvider = class CosmiframeExtensionProvider extends WalletExtensionProvider {
  constructor({
    networks,
    allowedParentOrigins,
  }: {
    networks: Network[];
    allowedParentOrigins: string[];
  }) {
    const cosmiframe = new Cosmiframe(allowedParentOrigins);

    super({
      id: 'cosmiframe',
      name: 'Cosmiframe',
      networks,
      extensionProviderAdapter: new Keplr({
        extensionResolver() {
          return cosmiframe.getKeplrClient() as any as KeplrWindow;
        },
        useExperimentalSuggestChain: false,
        setupOnUpdateEventListener() {
          // N/A
        },
      }),
    });
  }
};

export default CosmiframeExtensionProvider;
