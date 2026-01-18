# Copilot Instructions for daodao-secondary-gui

## Project Overview

This is a React + TypeScript + Vite DAO frontend for Cosmos blockchain with modular architecture. Core features: proposal creation/voting, wallet integration, and smart contract execution.

**Key Directories:**

- `src/components/`: UI (organized: `ui/`, `modals/`, `custom/`)
- `src/lib/`: Core logic (action types, voting modules, context providers)
- `src/hooks/`: Custom React hooks (wallet, balances, chain queries)
- `src/config/`: Static config (assets, chains, feature flags)
- `src/daodao/protobuf/`: Cosmos/CosmWasm protobuf definitions

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

All hooks return signals with `.value` access. See `src/lib/signals.ts` for utilities.

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

Vite config includes Node.js polyfills (Buffer, process) for Cosmos SDK. Preact Signals transform applied via Babel plugin.

## File Organization

- Feature folders over flat (e.g., `components/custom/proposals/`, not `ProposalCard.tsx` at root)
- Index files re-export for clean imports
- Action types must export both type definition AND ActionType object

## Reference Examples

- **Simple Form:** `src/lib/action-types/bank-send.tsx` (address input + token selector with max button)
- **Complex Form:** `src/lib/action-types/wasm-execute.tsx` (JSON editor + dynamic funds array with debouncing)
- **Adapter Pattern:** `src/lib/voting-modules/` (factory + multiple adapters)
- **Signals Docs:** `src/lib/signals.ts` (persisted signals, async signals, computed)

---

**Questions?** Check file examples above or existing implementations in `src/lib/action-types/` for patterns.
