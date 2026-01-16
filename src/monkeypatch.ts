import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { HttpBatchClient, Tendermint37Client } from "@cosmjs/tendermint-rpc";

const clients: Record<string, Tendermint37Client | undefined> = {};

const orig = SigningCosmWasmClient.connectWithSigner;
SigningCosmWasmClient.connectWithSigner = async (endpoint, signer, options) => {
  if (typeof endpoint === "string") {
    const client = getTendermintClient(endpoint);
    return SigningCosmWasmClient.createWithSigner(client, signer, options);
  }
  return await orig(endpoint, signer);
};

const origCosmWasm = CosmWasmClient.connect;
CosmWasmClient.connect = async (endpoint) => {
  if (typeof endpoint === "string") {
    const client = getTendermintClient(endpoint);
    return CosmWasmClient.create(client);
  }
  return await origCosmWasm(endpoint);
};

const getTendermintClient = (endpoint: string) => {
  let client: Tendermint37Client;

  if (clients[endpoint]) {
    client = clients[endpoint];
  } else {
    client = Tendermint37Client.create(
      new HttpBatchClient(endpoint, {
        batchSizeLimit: 10,
      })
    );
    clients[endpoint] = client;
  }
  return client;
};

export const getCosmWasmClient = async (endpoint: string) => {
  return CosmWasmClient.connect(endpoint);
};
