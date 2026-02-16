

# Add Credit Activity Log to Settings

## Summary

Add a "Credit Activity" section to the Subscription tab in Settings, showing a chronological log of all credit movements -- deductions, grants, purchases, and refunds -- with project names and action types.

## What Gets Built

### 1. Update Database Function: `deduct_credits`

The existing web `deduct_credits` RPC does **not** log to `credit_txns`. Update it to also insert a transaction record (like `cli_deduct_credits` already does), so both web and CLI deductions appear in the log.

The function will be updated to accept an optional `p_audit_id` and `p_description` parameter. Web callers will pass the audit ID and project name.

### 2. Update Web Deduction Flow

Update `useDeductCredits` in `src/hooks/useSubscription.ts` and its callers (the audit wizard) to pass the audit ID and project name so the description is recorded in `credit_txns`.

### 3. New Hook: `src/hooks/useCreditActivity.ts`

A React Query hook that fetches from `credit_txns` joined with `audits` (for project name fallback):

```typescript
supabase
  .from('credit_txns')
  .select('id, type, amount, balance_after, description, audit_id, created_at')
  .order('created_at', { ascending: false })
  .limit(50);
```

### 4. New Component: `src/components/settings/CreditActivityLog.tsx`

A card component showing the credit transaction history:

- Each row displays: action icon, description (parsed for project name), amount (+/-), balance after, and timestamp
- Color-coded: green for grants/purchases/refunds, red for deductions
- Transaction types mapped to readable labels: "Audit Deduction", "Credit Purchase", "Subscription Grant", "Refund"
- Project name extracted from the description field
- Empty state when no transactions exist

### 5. Update: `src/pages/Settings.tsx`

Add the `<CreditActivityLog />` component inside the Subscription tab, below the existing "Credit Balance" card and above the "Billing History" link card.

## UI Layout

```text
+---------------------------------------------+
| Credit Activity                              |
| Recent credit movements                      |
|                                              |
| +------------------------------------------+|
| | - CLI Audit: MyProject (3 contracts)     ||
| |   -15 credits    Balance: 35    2h ago   ||
| +------------------------------------------+|
| | + Subscription Grant                      ||
| |   +50 credits    Balance: 50    Feb 1    ||
| +------------------------------------------+|
| | - Web Audit: TokenSwap                   ||
| |   -8 credits     Balance: 0     Jan 28   ||
| +------------------------------------------+|
| | + Refund: Audit failed for MyProject     ||
| |   +15 credits    Balance: 50    Jan 27   ||
| +------------------------------------------+|
+---------------------------------------------+
```

## Technical Details

### Database Migration: Update `deduct_credits` RPC

Add `credit_txns` insert to the existing `deduct_credits` function and add optional parameters for audit context:

```sql
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_nloc_amount integer,
  p_is_starter boolean DEFAULT false,
  p_audit_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
...
  -- After the UPDATE, insert into credit_txns
  INSERT INTO public.credit_txns (user_id, type, amount, balance_after, audit_id, description)
  VALUES (v_user_id, 'deduction', -p_nloc_amount, v_new_balance, p_audit_id, 
          COALESCE(p_description, 'Web audit deduction'));
...
```

### Callers Updated

The `useRunAudit` hook (or wherever `deductCredits` is called before triggering `run-audit`) will pass audit ID and project name to the RPC.

### Transaction Type Icons and Colors

| Type       | Icon         | Color  | Label               |
|------------|-------------|--------|---------------------|
| deduction  | ArrowDown   | Red    | Audit / Deduction   |
| grant      | Gift        | Green  | Subscription Grant  |
| purchase   | Zap         | Green  | Credit Purchase     |
| refund     | RotateCcw   | Green  | Refund              |

