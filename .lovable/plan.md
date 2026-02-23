

# Fix Transaction History Pagination

## Problem

The `useBillingHistory` hook passes `pageSize` to both `usePowerUpPurchases` and `useSubscriptionHistory` independently. Each fetches up to 5 rows, resulting in up to 10 rows shown when the page size is set to 5.

## Solution

Change `useBillingHistory` to fetch all records from both tables (remove per-table pagination) and apply pagination to the **merged and sorted** result array client-side.

## Technical Changes

### `src/hooks/useBillingHistory.ts`

- Remove `page` and `pageSize` params from the individual `usePowerUpPurchases` and `useSubscriptionHistory` calls inside `useBillingHistory`
- Fetch all matching records from both tables (still respecting date filters)
- Merge, sort by date descending, then slice the combined array using `page` and `pageSize`
- Compute `totalCount` from the combined array length

### `src/pages/dashboard/BillingPage.tsx`

- No changes needed — it already passes `page` and `pageSize` to `useBillingHistory`, which will now handle them correctly on the merged data

