import MetamaskCosmosSnap from "../../internals/adapters/extensions/MetamaskCosmosSnap";
import type { Network } from "../../internals/network";
import WalletExtensionProvider from "./WalletExtensionProvider";

export const LeapMetamaskCosmosSnapExtensionProvider = class LeapMetamaskCosmosSnapExtensionProvider extends WalletExtensionProvider {
  constructor({ networks }: { networks: Network[] }) {
    super({
      id: "leap-metamask-cosmos-snap",
      name: "Leap Metamask Cosmos Snap",
      networks,
      extensionProviderAdapter: new MetamaskCosmosSnap({
        snapId: "npm:@leapwallet/metamask-cosmos-snap",
        extensionResolver() {
          if (
            !(window as any).ethereum ||
            !(window as any).ethereum.isMetaMask
          ) {
            throw new Error("Metamask is not available");
          }
          return (window as any).ethereum;
        },
        setupOnUpdateEventListener(callback) {
          (window as any).ethereum?.on("accountsChanged", () => {
            callback?.();
          });
        },
      }),
    });
  }
};

export default LeapMetamaskCosmosSnapExtensionProvider;
