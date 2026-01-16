import { Network } from "@/delphi-labs/shuttle-react";

function defaultBech32Config(
  mainPrefix: string,
  validatorPrefix = "val",
  consensusPrefix = "cons",
  publicPrefix = "pub",
  operatorPrefix = "oper"
) {
  return {
    bech32PrefixAccAddr: mainPrefix,
    bech32PrefixAccPub: mainPrefix + publicPrefix,
    bech32PrefixValAddr: mainPrefix + validatorPrefix + operatorPrefix,
    bech32PrefixValPub:
      mainPrefix + validatorPrefix + operatorPrefix + publicPrefix,
    bech32PrefixConsAddr: mainPrefix + validatorPrefix + consensusPrefix,
    bech32PrefixConsPub:
      mainPrefix + validatorPrefix + consensusPrefix + publicPrefix,
  };
}

export const TERRA: Network & { explorer: string; explorerName: string } = {
  // rpc: 'https://rpc-neutron.keplr.app/',
  // rest: 'https://lcd-neutron.keplr.app/',

  // rest: 'https://rest-kralum.neutron-1.neutron.org',
  // rpc: 'https://rpc-kralum.neutron-1.neutron.org',
  rest: "https://phoenix-lcd.erisprotocol.com",
  rpc: "https://phoenix-rpc.erisprotocol.com",
  explorer: "https://www.mintscan.io/terra",
  explorerName: "Mintscan",
  chainId: "phoenix-1",
  name: "Terra",
  gasPrice: "0.015uluna",
  bech32Config: defaultBech32Config("terra"),
  defaultCurrency: {
    coinDenom: "LUNA",
    coinMinimalDenom: "uluna",
    coinDecimals: 6,
    coinGeckoId: "terra-luna-2",
    gasPriceStep: {
      low: 0.015,
      average: 0.015,
      high: 0.04,
    },
  },
  features: ["ibc-transfer", "ibc-go"],
};
