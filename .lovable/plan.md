

# Fix: Add "upgrade" to payment_orders order_type CHECK constraint

## Root Cause

The `payment_orders` table has a CHECK constraint that only allows two values for `order_type`:
- `'subscription'`
- `'power_up'`

When the upgrade edge function calls `create_payment_order` with `p_order_type: 'upgrade'`, the INSERT fails with:
> `new row for relation "payment_orders" violates check constraint "payment_orders_order_type_check"`

This means the order is never created, so verify-payment and the webhook have nothing to look up, and the plan never gets updated.

## Fix

A single database migration to update the CHECK constraint:

```sql
ALTER TABLE public.payment_orders
  DROP CONSTRAINT payment_orders_order_type_check;

ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_order_type_check
  CHECK (order_type = ANY (ARRAY['subscription', 'power_up', 'upgrade']));
```

No code changes needed -- the edge functions already handle `'upgrade'` correctly. They just couldn't insert the row because the database was rejecting it.

## What This Fixes

| Step | Before | After |
|------|--------|-------|
| Create upgrade order | Fails with CHECK violation | Succeeds |
| verify-payment finds order | No order exists | Finds the upgrade order |
| Plan gets updated | Never happens | Updates to new plan |
| Success page | Shows wrong info | Shows "Upgrade Successful" |
