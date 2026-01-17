# Voting Modules System

A flexible, extensible system for querying members from different types of DAO voting modules.

## Overview

This system provides adapters for different voting module types that abstract away the complexity of querying member data. Each voting module type has different query patterns, and this system handles those differences automatically.

## Architecture

### Core Components

1. **Constants** (`constants.ts`)

   - Contract name enums and arrays for different voting module types
   - `VotingModuleType` enum
   - `getVotingModuleType()` function to detect module type from contract name

2. **Types** (`types.ts`)

   - `Member` interface - represents a member with address and voting power
   - `MembersResponse` interface - paginated response
   - `VotingModuleAdapter` interface - contract for all adapters

3. **Adapters** (`adapters/`)

   - `Cw20StakedAdapter` - for CW20 token-based voting
   - `Cw4Adapter` - for CW4 group-based voting
   - `TokenStakedAdapter` - for native/factory token staking

4. **Factory** (`adapter-factory.ts`)
   - `createVotingModuleAdapter()` - automatically creates the right adapter

## Supported Voting Module Types

✅ **CW20 Staked** - Token-based voting with CW20 tokens

- Queries: `info` → `staking_contract` → `list_stakers`
- Caching: 7 days for contract addresses

✅ **CW4** - Group-based voting with weighted members

- Queries: `info` → `group_contract` → `list_members`
- Caching: 7 days for contract addresses

✅ **Token Staked** - Native token factory-based voting

- Queries: `info` → `list_stakers` (direct)

✅ **Native Staked** - Native token staking

- Queries: `info` → `list_stakers` (direct)

✅ **CW721 Staked** - NFT-based voting

- Queries: `info` → RPC `/state` endpoint → `total_power_at_height`
- Parses raw contract state with hex keys and base64 values

⏳ **Coming Soon**

- ONFT Staked (Omnichain NFT voting)
- SG Community NFT (Stargaze community NFT voting)

## Usage

### Basic Usage

```typescript
import { createVotingModuleAdapter } from '@/lib/voting-modules';
import { useChain } from '@/hooks/useChain';

const chain = useChain(Chain.Terra);
const votingModuleAddress = 'terra1...';

// Create adapter automatically based on voting module type
const adapter = await createVotingModuleAdapter(votingModuleAddress, chain);

if (adapter) {
  // Fetch first page of members
  const { members, hasMore } = await adapter.fetchMembers(10);

  // Fetch next page
  const lastAddress = members[members.length - 1].address;
  const nextPage = await adapter.fetchMembers(10, lastAddress);
}
```

### Component Usage

The `MemberList` component handles everything automatically:

```typescript
import { MemberList } from '@/components/custom/members/MemberList';

<MemberList votingModuleAddress={daoData.voting_module} title="DAO Members" />;
```

## Adding Support for New Voting Module Types

To add support for a new voting module type:

1. **Add contract names to `constants.ts`**:

```typescript
export const DAO_VOTING_NEW_TYPE_CONTRACT_NAMES = ['crates.io:new-voting-module'];
```

2. **Add to `VotingModuleType` enum**:

```typescript
export enum VotingModuleType {
  // ...existing types
  NEW_TYPE = 'NEW_TYPE',
}
```

3. **Update `getVotingModuleType()` function**:

```typescript
if ((DAO_VOTING_NEW_TYPE_CONTRACT_NAMES as readonly string[]).includes(contractName)) {
  return VotingModuleType.NEW_TYPE;
}
```

4. **Create adapter in `adapters/NewTypeAdapter.ts`**:

```typescript
export class NewTypeAdapter implements VotingModuleAdapter {
  async fetchMembers(limit: number, startAfter?: string): Promise<MembersResponse> {
    // Implement query logic specific to this module type
  }

  getType(): VotingModuleType {
    return VotingModuleType.NEW_TYPE;
  }
}
```

5. **Add to factory in `adapter-factory.ts`**:

```typescript
case VotingModuleType.NEW_TYPE:
  return new NewTypeAdapter(votingModuleAddress, chain);
```

## Query Patterns

### CW20 Staked (Two-Step Query)

```
1. Query voting module: { info: {} } → get contract name
2. Query voting module: { staking_contract: {} } → get staking contract address
3. Query staking contract: { list_stakers: { limit, start_after } }
```

### CW4 (Two-Step Query)

```
1. Query voting module: { info: {} } → get contract name
2. Query voting module: { group_contract: {} } → get group contract address
3. Query group contract: { list_members: { limit, start_after } }
```

### Token/Native Staked (Direct Query)

```
1. Query voting module: { info: {} } → get contract name
2. Query voting module: { list_stakers: { limit, start_after } }
```

### CW721 Staked (RPC State Query)

```
1. Query voting module: { info: {} } → get contract name
2. Query RPC: /cosmwasm/wasm/v1/contract/{address}/state → parse hex keys/base64 values
3. Query voting module: { total_power_at_height: {} } → get total for percentages
```

Keys have format: `00026e62` (prefix) + hex(terra_address)
Values are base64-encoded JSON strings with token counts.

## Caching Strategy

- **Contract info queries**: Cached for 7 days (10,080 minutes)
- **Intermediate contract addresses**: Cached for 7 days
- **Member lists**: Not cached (always fresh for pagination)

This ensures that contract addresses are stable while member data stays current.

## Error Handling

The system gracefully handles:

- Unsupported voting module types (returns `null`)
- Query failures (caught and logged)
- Missing data (empty states shown in UI)

## Testing with Example DAO

Example CW20 Staked DAO:

```
DAO: terra1tkersa2mqwy2h8exj799qx2xrhdu0dkymk9psp6v0k4kz4tkxucssgluec
Voting Module: terra1vjzdmt363a5a4tzheensxv5ygq9d7m2680l9fhceawquesz26vvqapfr9p
Contract: crates.io:dao-voting-cw20-staked
```

Test queries:

1. `{ info: {} }` → get contract name
2. `{ staking_contract: {} }` → terra1xuqh84yz35h70p3ppt76dz5kgwwtwmsv34pg0gw6ld4ntptgjcrqe2e70t
3. `{ list_stakers: { limit: 10 } }` → get member list
