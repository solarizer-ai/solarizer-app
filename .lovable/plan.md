

# Fix: Previous contracts not marked as done when phase advances

## Problem
In `AuditProgressPanel.tsx`, the contract completion logic on line 119 relies on `orchestration.progress.contractIndex` to determine if a previous contract is done (`idx < currentIdx`). However, the backend often updates `currentContract` (the path string) without reliably incrementing `contractIndex`, so it defaults to 0 -- meaning no contract ever satisfies `idx < 0`.

The screenshot confirms: "SingleProviderPoolType.sol" shows as "pending" even though the audit has moved on to "SingleProviderHelper.sol".

## Fix (single file: `src/components/AuditProgressPanel.tsx`)

### Derive effective index from `currentContract` path

In the `contractList` useMemo (lines 111-123), compute the effective current index by finding the position of `currentContract` in the paths array, then fall back to `contractIndex`:

```typescript
const currentContractPath = orchestration.progress.currentContract;
const derivedIdx = currentContractPath
  ? paths.findIndex((p) => p === currentContractPath)
  : -1;
const effectiveIdx = derivedIdx >= 0 ? derivedIdx : currentIdx;
```

Then update the done check from:
```typescript
const done = prog?.done || idx < currentIdx || activePhaseIdx > 1;
```
to:
```typescript
const done = prog?.done || idx < effectiveIdx || activePhaseIdx > 1;
```

This ensures that any contract appearing before the currently active contract in the list is correctly marked as done, regardless of whether `contractIndex` is properly set by the backend.

