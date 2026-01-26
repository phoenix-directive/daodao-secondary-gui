# Copilot Instructions for daodao-secondary-gui

## Project Overview

Phoenix DAOs is a lightweight, high-performance DAO interface for Cosmos blockchain. Built with React + TypeScript + Vite, it's a complete rewrite of [DAO DAO](https://github.com/DA0-DA0/dao-dao-ui) optimized for speed and essential functionality. Core features: proposal creation/voting, wallet integration, smart contract execution, and multi-chain support (Terra, Neutron, etc.).

**Key Directories:**

- `src/components/`: UI (organized: `ui/`, `modals/`, `custom/`)
- `src/lib/`: Core logic (action types, voting modules, context providers)
- `src/hooks/`: Custom React hooks (wallet, balances, chain queries)
- `src/config/`: Static config (assets, chains, feature flags)
- `src/daodao/protobuf/`: Cosmos/CosmWasm protobuf definitions
- `src/wallet/`: Shuttle wallet integration (Keplr, Leap, etc.)

## State Management: Preact Signals

Uses **Preact Signals** for fine-grained reactivity, NOT useState/Context for data state.

**Signals Pattern:**

```tsx
import { signal, computed } from '@preact/signals-react';
const count = signal(0);
const doubled = computed(() => count.value * 2);
count.value = 5; // Auto-updates UI
```

**Async Data Pattern** (`useAsyncSignal`):

```tsx
const { data, loading, error } = useAsyncSignal(
  async () => chain.read.query(contract, msg),
  [contract, globalReload.value], // Dependencies
);
// Access: data.value, loading.value, error.value
```

**Standalone async signals** (`createAsyncSignal` in `src/lib/signals.ts`):

```tsx
const data = createAsyncSignal(async () => fetchData(), initialValue);
// Auto-fetches on creation, returns { data, loading, error, load }
```

All hooks return signals with `.value` access. See `src/lib/signals.ts` for utilities (`createPersistedSignal`, `createStore`).

## Action Registry System

Actions are plugin-style objects registered centrally. Each implements `ActionType<T>` interface.

**Structure** (`src/lib/action-registry.ts`):

```tsx
interface ActionType<T> {
  id: string;
  name: string;
  icon: LucideIcon;
  guard: (data: any) => data is T; // Type guard
  getTitle: (data: T) => string;
  expandable: boolean;
  FormEditor: ComponentType<{
    data: T;
    onUpdate: (path: string[], value: any) => void;
  }>;
  ViewComponent?: ComponentType<{ data: T }>;
}
```

**Adding New Actions:**

1. Create file in `src/lib/action-types/` (e.g., `my-action.tsx`)
2. Export action object and register in `src/lib/action-types/index.ts`
3. **Order matters**: Specific types before generic (CW20 before WasmExecute)

See `bank-send.tsx` (simple form) or `wasm-execute.tsx` (complex with JSON editor).

## Token Amount Conversion (Critical)

**Always store in base units**, display in decimals.

```tsx
import { fromBaseUnits, toBaseUnits } from '@/hooks/useBalances';

// Store: "1000000" (base units) → Display: "1.000000" (6 decimals)
const display = fromBaseUnits('1000000', 6); // "1.000000"
const base = toBaseUnits('1.5', 6); // "1500000"
```

**Form Pattern** (local state + onBlur):

```tsx
const [inputValue, setInputValue] = useState(fromBaseUnits(data.amount, decimals));
const handleBlur = () => {
  const baseAmount = toBaseUnits(inputValue, decimals);
  onUpdate(['path', 'to', 'amount'], baseAmount);
};
```

## Form State Updates

**Never mutate directly.** Use `onUpdate` with path array:

```tsx
onUpdate(['bank', 'send', 'to_address'], newValue);
onUpdate(['wasm', 'execute', 'funds'], [{ denom: 'uluna', amount: '1000' }]);
```

## Balance/Token Selection

Only show **available balances** from `useProposalFormContext`:

```tsx
const { balances } = useProposalFormContext(); // Signal-based
const availableTokens = balances.data.value || [];
// Filter by balances.data.value, sorted by USD value
```

## Voting Modules (Adapter Pattern)

Voting modules use factory + adapters for different DAO types (CW4, CW20 staked, etc.).

**Usage:**

```tsx
import { createVotingModuleAdapter } from '@/lib/voting-modules';
const adapter = await createVotingModuleAdapter(address, chain);
const { members, hasMore } = await adapter.fetchMembers(limit, startAfter);
```

**Adding New Types:** See `src/lib/voting-modules/README.md` and implement `VotingModuleAdapter` interface.

## Chain Integration

Access blockchain via `ChainService` and hooks:

```tsx
const chain = useChain(Chain.Terra);
const address = useAddress(chain.chainId);
await chain.read.query(contract, msg); // Smart contract query
await chain.read.balances(address); // Get balances
```

Auto-detects chain from contract address prefix (bech32).

## Developer Workflows

```bash
pnpm dev         # Start dev server (port 5176)
pnpm build       # TypeScript + Vite build
pnpm lint        # ESLint
pnpm analyze     # Bundle analyzer
pnpm preview     # Preview production build
```

**VS Code Tasks:** "Frontend: Dev", "Frontend: Analyze" available.

## UI Conventions

- **Icons:** Lucide React (`import { Trash } from 'lucide-react'`)
- **Components:** Radix UI primitives + custom wrappers in `src/components/ui/`
- **Styling:** Tailwind CSS v4 + CSS modules for components
- **JSON Editing:** Monaco Editor for contract messages (see `wasm-execute.tsx`)

## Context Providers

- `ProposalFormProvider`: Provides balances signal + DAO address
- `ChainProvider`: Provides chain ID context
- `ThemeProvider`: Dark/light mode management

## Polyfills & Build

Vite config includes Node.js polyfills (Buffer, process) for Cosmos SDK compatibility. Preact Signals transform applied via Babel plugin (`module:@preact/signals-react-transform`).

**Critical monkeypatch:** `src/monkeypatch.ts` optimizes CosmJS client creation by reusing `HttpBatchClient` instances per endpoint (imported in `main.tsx` before app initialization). This prevents connection leaks and improves RPC performance.

**Build optimization:**

- Tree-shaking enabled for minimal bundle size
- `versionHashPlugin` generates unique build hashes in `public/version.json` for cache busting
- Analyze bundle: `pnpm analyze` (uses `vite-bundle-visualizer`)

## File Organization

- Feature folders over flat (e.g., `components/custom/proposals/`, not `ProposalCard.tsx` at root)
- Index files re-export for clean imports
- Action types must export both type definition AND ActionType object
- **Keep utilities separate from components** for Fast Refresh: Pure utility functions go in `src/lib/`, React components stay in `src/components/`

## Fast Refresh Best Practices

To maintain Fast Refresh in development:

- **Separate utilities from components**: Move pure functions (formatting, calculations, type guards) to `src/lib/` or `src/hooks/helpers/`
- **Components-only files**: Files in `src/components/` should only export React components
- **Re-export pattern**: Components can re-export utilities for convenience, but the source should be in `src/lib/`

**Example:**

```tsx
// ❌ Bad: Breaks Fast Refresh
// src/components/MyComponent.tsx
export function formatData(data: string) {
  /* ... */
}
export function MyComponent() {
  /* uses formatData */
}

// ✅ Good: Maintains Fast Refresh
// src/lib/data-helpers.ts
export function formatData(data: string) {
  /* ... */
}

// src/components/MyComponent.tsx
import { formatData } from '@/lib/data-helpers';
export function MyComponent() {
  /* uses formatData */
}
```

See `src/lib/member-helpers.ts` (utilities) + `src/components/custom/members/member-utils.tsx` (UI components) for reference.

## Reference Examples

- **Simple Form:** `src/lib/action-types/bank-send/BankSendAction.tsx` (address input + token selector with max button)
- **Complex Form:** `src/lib/action-types/wasm-execute/WasmExecuteAction.tsx` (JSON editor + dynamic funds array with debouncing)
- **Adapter Pattern:** `src/lib/voting-modules/` (factory + multiple adapters)
- **Signals Docs:** `src/lib/signals.ts` (persisted signals, async signals, computed)

---

**Questions?** Check file examples above or existing implementations in `src/lib/action-types/` for patterns.
