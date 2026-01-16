import { Network, WalletMobileProvider } from "@/delphi-labs/shuttle-react";
import { MyCosmosWalletConnect } from "./MyCosmosWalletConnect";

export class MyKeplrMobileProvider extends WalletMobileProvider {
  constructor({
    networks,
    walletConnectProjectId,
  }: {
    networks: Network[];
    walletConnectProjectId?: string;
  }) {
    super({
      id: "mobile-keplr",
      name: "Keplr - WalletConnect",
      networks,
      mobileProviderAdapter: new MyCosmosWalletConnect({
        walletConnectPeerName: "Keplr",
        walletConnectProjectId,
        networks,
      }),
    });
  }

  generateIntents(uri?: string): {
    qrCodeUrl: string;
    iosUrl: string;
    androidUrl: string;
  } {
    return {
      qrCodeUrl: uri || "",
      iosUrl: `keplrwallet://wcV2?${uri}`,
      androidUrl: `intent://wcV2?${uri}#Intent;package=com.chainapsis.keplr;scheme=keplrwallet;end;`,
    };
  }
}
