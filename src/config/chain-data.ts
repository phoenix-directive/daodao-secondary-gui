// Re-export only the specific data we need from chain-registry
// This helps with tree-shaking by avoiding the barrel export in chain-registry/mainnet/terra2
// Use ESM paths to ensure proper tree-shaking (the mainnet/ path uses CommonJS which bundles everything)

export { default as assetList } from "chain-registry/mainnet/terra2/asset-list";
export { default as chain } from "chain-registry/mainnet/terra2/chain";
// Deliberately NOT importing ibc-data to reduce bundle size
