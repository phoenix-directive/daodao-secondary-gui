# daodao-secondary-gui — Porting & Rewrite Instructions  
**Reference project:** dao-dao-ui

---

## Goal
Rewrite the UI into a **clean, minimal, fast** application by **selectively porting behaviors** from `dao-dao-ui` while avoiding its architectural complexity.

`dao-dao-ui` is treated as a **read-only reference** (behavioral spec + parts bin).  
`daodao-secondary-gui` is the **only source of truth**.

**Core rule:** Port **behavior**, not structure.

---

## Workspace Setup (Strongly Recommended)
Open a single VS Code workspace containing both repositories:

- `../dao-dao-ui` (old, reference-only)
- `../daodao-secondary-gui` (new, rewrite)

Optional: create a `.code-workspace` file in the parent directory.

---

## Rewrite Principles (Non-Negotiable)

1. **No wholesale copying**
   - Do not copy components, folders, hooks, or state architecture from `dao-dao-ui`.

2. **Contract-first**
   - External contracts define shapes and naming.
   - Internal code follows contracts as closely as possible.

3. **Minimal modeling**
   - Avoid creating parallel domain models unless strictly necessary.

4. **Vertical slices**
   - Rewrite feature-by-feature end-to-end (data → logic → UI).

5. **Pure logic first**
   - Core logic must be deterministic and testable.

6. **Tests encode behavior**
   - Important behavior lives in tests, not tribal knowledge.

7. **Performance-aware**
   - Instrument early, optimize after correctness.

---

## Contract-First Modeling (CRITICAL)

### Principle
**Models in `daodao-secondary-gui` must follow contract shapes as closely as possible.**

The contract (API / chain / query response) is the **authoritative schema**.

### Default rule
- Prefer using **contract DTO types directly** throughout the app.
- Do **not** introduce separate “domain models” by default.

### Allowed deviations (only with justification)
You may create derived or extended models **only if** one of the following applies:

1. **Computed fields**
   - e.g. parsed numbers, formatted dates, derived status flags

2. **Normalization**
   - e.g. flattening deeply nested structures for UI consumption

3. **Stability boundary**
   - contract is unstable and needs a stable internal representation

4. **Performance**
   - converting once and caching is measurably beneficial

### Rules when deviating
If you introduce a derived model:
- Keep field names and casing aligned with the contract where possible
- Provide an explicit conversion function:
  - `fromContractX()`
  - `withComputedX()`
- Add tests for the conversion
- Document the reason in `PORTING_NOTES.md`

### Preferred patterns
✅ Extend, don’t reinvent:
```ts
type Proposal = ContractProposal & {
  computedStatus: ProposalStatus
}
