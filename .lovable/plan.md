
# Fix: Cashfree Environment Mismatch

## Problem Identified

The upgrade is failing because of a **frontend/backend environment mismatch**:

| Component | Environment | URL |
|-----------|-------------|-----|
| Backend (Edge Function) | Production | `https://api.cashfree.com/pg` |
| Frontend (Cashfree SDK) | Sandbox (default) | `https://sandbox.cashfree.com/pg` |

The backend creates a payment session on Cashfree Production, but the frontend SDK (defaulting to sandbox mode) tries to use that session on the Sandbox server, which doesn't recognize the production session ID.

---

## Root Cause

In the frontend hooks, the SDK mode falls back to `"sandbox"` when `VITE_CASHFREE_MODE` is not set:

```typescript
const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE || "sandbox";
```

Your `.env` file currently has:
```
VITE_SUPABASE_PROJECT_ID="..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="..."
```

**`VITE_CASHFREE_MODE` is missing**, so the SDK defaults to sandbox mode.

---

## Solution

Add `VITE_CASHFREE_MODE=production` to the `.env` file so the frontend SDK matches the backend environment.

### File to Update

| File | Change |
|------|--------|
| `.env` | Add `VITE_CASHFREE_MODE=production` |

### Updated .env Content

```text
VITE_SUPABASE_PROJECT_ID="xylfnqrtzqfduutdcxvu"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
VITE_SUPABASE_URL="https://xylfnqrtzqfduutdcxvu.supabase.co"
VITE_CASHFREE_MODE=production
```

---

## Technical Details

### How Cashfree SDK Mode Works

The Cashfree JS SDK (`sdk.cashfree.com/js/v3/cashfree.js`) uses the `mode` parameter to determine which API endpoint to connect to:

- `mode: "sandbox"` → connects to `https://sandbox.cashfree.com`
- `mode: "production"` → connects to `https://api.cashfree.com`

Payment sessions are environment-specific. A session created on production cannot be used on sandbox, and vice versa.

### Files Using This Variable

1. `src/hooks/useCashfreeSubscription.ts` (line 164)
2. `src/hooks/useCashfreeCheckout.ts` (line 74)

Both files use the same pattern:
```typescript
const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE || "sandbox";
const cashfree = new window.Cashfree({ mode: cashfreeMode });
```

---

## Verification After Fix

After adding `VITE_CASHFREE_MODE=production`:

1. The app will need to rebuild (happens automatically on save)
2. Navigate to Pricing page and click Upgrade
3. You should be redirected to `api.cashfree.com` (production) instead of `sandbox.cashfree.com`
4. The checkout should load correctly with your payment session

---

## Summary

| Step | Action |
|------|--------|
| 1 | Add `VITE_CASHFREE_MODE=production` to `.env` |
| 2 | App rebuilds automatically |
| 3 | Test upgrade flow - should now redirect to production Cashfree |
