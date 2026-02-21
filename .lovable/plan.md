

# Dashboard Sidebar & Data View Improvements

## 1. Sidebar Navigation Restructure

Move Billing to Account, Documentation above user footer with a separator, and remove redundant items.

New sidebar structure:

```text
OVERVIEW
  Dashboard
  Analyses
  Credit Activity

MANAGE
  API Keys
  Sharing

ACCOUNT
  Profile
  Security
  Billing            <-- moved from MANAGE

─────────────────
Documentation        <-- above the separator/user footer
─────────────────
[User avatar + name]
```

**File:** `src/components/DashboardSidebar.tsx`
- Move `Billing` from MANAGE group to ACCOUNT group (after Security)
- Documentation link stays where it is (already at bottom, above footer) -- no change needed there
- The screenshot shows Documentation sitting right above the user profile with a divider, which matches the current layout

## 2. Date Range Filter + Pagination for Credit Activity

Add a date range picker and pagination to the Credit Activity page.

**File:** `src/hooks/useCreditActivity.ts`
- Accept `startDate`, `endDate`, `page`, and `pageSize` parameters
- Use `.gte('created_at', startDate)` and `.lte('created_at', endDate)` when dates are provided
- Use `.range(from, to)` for pagination instead of `.limit(50)`
- Return a count query alongside data for total pages

**File:** `src/components/settings/CreditActivityLog.tsx`
- Add date range inputs (two `<input type="date">` fields) at the top of the card
- Add pagination controls at the bottom (Previous / Next buttons + "Page X of Y")
- Pass date range and page state to the hook
- Default: no date filter (show all), page 1, 20 items per page

## 3. Date Range Filter + Pagination for Transaction History (Billing Page)

Add the same date range + pagination pattern to the Transaction History section.

**File:** `src/hooks/useBillingHistory.ts`
- Add `startDate`, `endDate`, `page`, `pageSize` params to `usePowerUpPurchases` and `useSubscriptionHistory`
- Filter by date range when provided
- Add pagination with `.range()`
- Return total count for pagination

**File:** `src/pages/dashboard/BillingPage.tsx`
- Add date range inputs above the Transaction History card
- Add pagination controls below the transaction list
- Default: no date filter, page 1, 15 items per page

## 4. Remove Greeting Exclamation (already done, verify)

Confirm the `!` is already removed from `DashboardHome.tsx` greeting.

---

## Technical Details

### Pagination Pattern (shared across both views)

Both hooks will follow this pattern:
```
- State: page (number), startDate (string | null), endDate (string | null)
- Query: .gte/.lte for date filtering, .range((page-1)*size, page*size-1) for pagination
- Count: separate count query or use { count: 'exact' } option in Supabase
- UI: "Previous" / "Next" buttons, disabled at boundaries, "Page X of Y" label
```

### Date Range UI

Simple inline date inputs styled with the existing Input component:
```text
[From: ____] [To: ____] [Clear]
```
Placed above each data list, inside the Card header area.

### Files to modify

| File | Change |
|------|--------|
| `src/components/DashboardSidebar.tsx` | Move Billing to ACCOUNT group |
| `src/hooks/useCreditActivity.ts` | Add date range filtering + pagination support |
| `src/components/settings/CreditActivityLog.tsx` | Add date range picker + pagination UI |
| `src/hooks/useBillingHistory.ts` | Add date range filtering + pagination support |
| `src/pages/dashboard/BillingPage.tsx` | Add date range picker + pagination to transaction history |

### Files unchanged
- All other dashboard pages, hooks, and components remain as-is
- No new dependencies needed (date-fns already installed, Input component exists)
