# Phoenix DAOs

A lightweight, high-performance DAO interface for Cosmos blockchain. Built with React + TypeScript + Vite for speed and efficiency.

## About

**Phoenix DAOs** is a complete rewrite of [DAO DAO](https://github.com/DA0-DA0/dao-dao-ui), optimized for performance and simplicity. While DAO DAO provides comprehensive DAO management features, Phoenix DAOs focuses on speed and essential functionality.

> **Not a replacement for DAO DAO, but a faster alternative for quick DAO management.**  
> Want full features? Use [DAO DAO](https://daodao.zone).  
> Want speed? Use **Phoenix DAOs**!

### Credits

Built upon the excellent foundation of [DAO DAO](https://github.com/DA0-DA0/dao-dao-ui):

- Type interfaces and protobuf definitions adapted from DAO DAO
- DApp integration patterns partially rewritten
- Core application completely rebuilt for performance

## Features

- **⚡ Fast & Lightweight:** Optimized bundle size with tree-shaking and code splitting
- **📝 Proposal Management:** Create, vote, and execute proposals with inline action editor
- **👥 Member Management:** View members, stake/unstake tokens, manage voting power
- **💰 Treasury:** View and manage DAO assets across multiple chains
- **🏛️ Sub-DAOs:** Hierarchical DAO structures with parent-child relationships
- **🔌 DApp Integration:** Embedded apps marketplace (Astroport, Warp, etc.)
- **👛 Wallet Integration:** Keplr, Leap, and more via Shuttle
- **🎨 Modern UI:** Clean interface with dark/light mode

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **State Management:** Preact Signals (fine-grained reactivity)
- **Blockchain:** Cosmos SDK + CosmWasm
- **Wallet:** Shuttle integration
- **UI:** Radix UI + Tailwind CSS v4 + Lucide icons
- **Code Editor:** Monaco Editor (for JSON contract messages)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev         # Start dev server (port 5176)
pnpm build       # TypeScript + Vite build
pnpm lint        # ESLint
pnpm analyze     # Bundle analyzer
pnpm preview     # Preview production build
```

### VS Code Tasks

- "Frontend: Dev" - Start development server
- "Frontend: Analyze" - Run bundle analyzer

## Project Structure

```
src/
├── components/      # UI components
│   ├── ui/         # Base UI components (Radix + custom)
│   ├── modals/     # Modal dialogs
│   └── custom/     # Feature-specific components
├── lib/            # Core logic
│   ├── action-types/        # Proposal action implementations
│   ├── voting-modules/      # DAO voting adapters
│   └── signals.ts           # Preact Signals utilities
├── hooks/          # Custom React hooks
├── config/         # Static configuration
│   ├── assets.ts            # Token/asset registry
│   ├── chain-data.ts        # Chain metadata
│   └── apps.ts              # DApp marketplace config
├── pages/          # Route components
│   ├── dao/                 # DAO pages (proposals, members, treasury, sub-DAOs)
│   └── LandingPage.tsx      # Home/discovery page
├── daodao/         # Cosmos/CosmWasm protobuf definitions
└── wallet/         # Wallet integration (Shuttle + providers)
```

## Architecture

### Performance Optimizations

- **Build-time hash versioning:** Automatic cache-busting via `version.json`
- **Tree-shaking:** Selective chain-registry imports, avoiding barrel exports
- **Code splitting:** Dynamic imports for heavy components (Monaco Editor)
- **Polyfills:** Minimal Node.js polyfills (Buffer, process) for Cosmos SDK compatibility
- **Bundle analysis:** Built-in `pnpm analyze` command for size audits

## Key Concepts

### State Management with Preact Signals

This project uses **Preact Signals** instead of useState/Context for data state:

```tsx
import { signal, computed } from '@preact/signals-react';

const count = signal(0);
const doubled = computed(() => count.value * 2);
count.value = 5; // Auto-updates UI
```

For async data, use `useAsyncSignal`:

```tsx
const { data, loading, error } = useAsyncSignal(
  async () => chain.read.query(contract, msg),
  [contract, globalReload.value],
);
```

### Action Registry System

Actions (proposals) are plugin-style objects implementing the `ActionType<T>` interface. Each action has:

- Form editor component
- View component
- Type guard for validation
- Title generator
- Icon

To add a new action type:

1. Create file in `src/lib/action-types/`
2. Export action object and register in `src/lib/action-types/index.ts`
3. **Order matters:** Specific types before generic

See `bank-send.tsx` for a simple example or `wasm-execute.tsx` for complex forms.

### Token Amount Conversion

**Always store amounts in base units**, display in decimals:

```tsx
import { fromBaseUnits, toBaseUnits } from '@/hooks/useBalances';

const display = fromBaseUnits('1000000', 6); // "1.000000"
const base = toBaseUnits('1.5', 6); // "1500000"
```

### Voting Modules

Voting modules use factory pattern + adapters for different DAO types (CW4, CW20 staked, etc.):

### DAO Features

#### Proposals Tab

- Create proposals with multiple actions (bank send, wasm execute, staking, etc.)
- Vote on active proposals
- Execute passed proposals
- View proposal history and status

#### Members Tab

- View voting members and their power
- Search and filter members
- Export member list to CSV

#### Membership Tab

- Stake/unstake tokens (CW20, native, NFT-based DAOs)
- View personal voting power
- Manage delegation (if supported)

#### Treasury Tab

- View all DAO-owned assets
- Filter by token type
- Display USD values (via price feeds)
- Multi-chain asset support

#### Sub-DAOs Tab

- Browse child DAOs
- Navigate hierarchical DAO structures
- View sub-DAO metadata

#### Apps Tab

- Embedded DApp marketplace
- Chain-specific app filtering
- Quick access to DeFi protocols, automation tools, etc.

```tsx
import { createVotingModuleAdapter } from '@/lib/voting-modules';
const adapter = await createVotingModuleAdapter(address, chain);
const { members } = await adapter.fetchMembers(limit, startAfter);
```

### Chain Integration

Access blockchain via `ChainService`:

```tsx
const chain = useChain(Chain.Terra);
const address = useAddress(chain.chainId);
await chain.read.query(contract, msg);
await chain.read.balances(address);
```

## Development Guidelines

### Fast Refresh Best Practices

To maintain Fast Refresh:

- Keep pure functions in `src/lib/` or `src/hooks/helpers/`
- Components in `src/components/` should only export React components
- Use re-export pattern for utilities if needed

### Form State Updates

Never mutate directly. Use `onUpdate` with path array:

```tsx
onUpdate(['bank', 'send', 'to_address'], newValue);
```

### File Organization

- Feature folders over flat structure
- Index files for clean imports
- Separate utilities from components

## Documentation

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for comprehensive development guide including:

- Action registry details
- Voting module adapters
- Signal patterns
- Context providers
- UI conventions

## License

See [LICENSE](LICENSE)
