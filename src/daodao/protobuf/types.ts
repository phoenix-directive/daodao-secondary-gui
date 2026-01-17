// export type UnifiedCosmosMsg = CosmosMsgFor_Empty;

export type DecodedStargateMsg<Value = any> = {
  stargate: {
    typeUrl: string;
    value: Value;
  };
};

export enum ChainId {
  CosmosHubMainnet = 'cosmoshub-4',
  CosmosHubProviderTestnet = 'provider',
  JunoMainnet = 'juno-1',
  JunoTestnet = 'uni-7',
  OsmosisMainnet = 'osmosis-1',
  OsmosisTestnet = 'osmo-test-5',
  StargazeMainnet = 'stargaze-1',
  StargazeTestnet = 'elgafar-1',
  NeutronMainnet = 'neutron-1',
  NeutronTestnet = 'pion-1',
  TerraMainnet = 'phoenix-1',
  TerraClassicMainnet = 'columbus-5',
  MigalooMainnet = 'migaloo-1',
  MigalooTestnet = 'narwhal-2',
  NobleMainnet = 'noble-1',
  KujiraMainnet = 'kaiyo-1',
  KujiraTestnet = 'harpoon-4',
  ChihuahuaMainnet = 'chihuahua-1',
  OraichainMainnet = 'Oraichain',
  ArchwayMainnet = 'archway-1',
  InjectiveMainnet = 'injective-1',
  BitsongMainnet = 'bitsong-2b',
  BitsongTestnet = 'bobnet',
  OmniflixHubMainnet = 'omniflixhub-1',
  OmniflixHubTestnet = 'flixnet-4',
  SecretMainnet = 'secret-4',
  SecretTestnet = 'pulsar-3',
  BabylonTestnet = 'bbn-test-5',
  ThorchainMainnet = 'thorchain-1',
  ThorchainStagenet = 'thorchain-stagenet-2',
  IntergazeMainnet = 'intergaze-1',
  DaodiseoTestnet = 'ithaca-1',
  KopiMainnet = 'luwak-1',
  RegenMainnet = 'regen-1',
  RegenTestnet = 'regen-upgrade',
  PryzmMainnet = 'pryzm-1',

  // Local testing chain powered by Starship.
  StarshipTestChain = 'starship-chain',
}

export type AnyChain = {
  chainId: string;
  chainName: string;
  bech32Prefix: string;
  prettyName: string;
  //   /**
  //    * Chain registry definition if exists.
  //    */
  //   chainRegistry?: Chain
  //   /**
  //    * Skip chain definition if fetched via Skip API.
  //    */
  //   skipChain?: SkipChain
};
