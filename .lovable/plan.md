

# Security Hardening (Pre-Launch)

Five issues identified and verified against the current codebase. All are confirmed present and need fixing.

---

## 1. P0-1: Atomic Credit Increment (CRITICAL)

**Problem:** `razorpay-webhook/index.ts` lines 249-262 use a read-then-write pattern on `nloc_credits`, causing a race condition where concurrent `subscription.charged` webhooks can overwrite each other and lose paid credits.

**Fix:**
- Create a new DB function `add_renewal_credits(p_user_id UUID, p_credits INTEGER)` that atomically increments `nloc_credits.credits_remaining` and returns the new balance.
- Replace the entire read-then-write block (lines 234-278) with a single RPC call + credit_txns insert using the returned balance.

---

## 2. P0-2: Atomic Webhook Idempotency (CRITICAL)

**Problem:** Lines 58-73 use a check-then-insert pattern on `subscription_events.event_id`. Two concurrent webhooks with the same `event_id` can both pass the check.

**Fix:**
- Add a `UNIQUE` constraint on `subscription_events.event_id` (no duplicates exist currently -- verified).
- Replace the check-then-insert with an immediate INSERT. If the insert fails with error code `23505` (unique violation), return "already processed". Move this guard to the top of the handler, before the switch statement, so ALL event types are covered.

---

## 3. P0-3: Timing Attack on Legacy Callback (CRITICAL)

**Problem:** `verifyCallback.ts` line 69 uses `!==` for comparing `callbackSecret` to `expectedSecret`, which is vulnerable to timing attacks.

**Fix:** Replace the direct string comparison with `crypto.subtle.timingSafeEqual` (same pattern already used for per-audit tokens earlier in the same file). Encode both strings, compare lengths first (with a dummy comparison to maintain constant time), then use `timingSafeEqual`.

---

## 4. P0-5: Enforce CSP (HIGH)

**Problem:** `index.html` line 49 uses `Content-Security-Policy-Report-Only`, which logs but does not block XSS.

**Fix:** Change `Content-Security-Policy-Report-Only` to `Content-Security-Policy` and append `; frame-ancestors 'none'` to prevent clickjacking.

---

## 5. P1-4: Razorpay Script SRI (MEDIUM -- Accepted Risk)

**Problem:** Razorpay `checkout.js` has no `integrity` attribute.

**Assessment:** Razorpay does not support SRI (script content changes without URL versioning). Adding SRI would break the integration.

**Fix:** Add a comment documenting the accepted risk. No code change to the script tag itself.

---

## Technical Details

### Migration SQL

```sql
-- Atomic credit increment for subscription renewals
CREATE OR REPLACE FUNCTION public.add_renewal_credits(
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  UPDATE nloc_credits
  SET credits_remaining = credits_remaining + p_credits,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits_remaining INTO v_new_total;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No credit record for user %', p_user_id;
  END IF;

  RETURN v_new_total;
END;
$$;

-- Unique constraint for idempotent webhook processing
ALTER TABLE subscription_events
  ADD CONSTRAINT subscription_events_event_id_unique UNIQUE (event_id);
```

### Files Modified

| File | Change |
|------|--------|
| DB migration | `add_renewal_credits` RPC + UNIQUE constraint |
| `supabase/functions/razorpay-webhook/index.ts` | Replace read-then-write with RPC call; replace check-then-insert with insert-on-conflict |
| `supabase/functions/_shared/verifyCallback.ts` | Replace `!==` with `crypto.subtle.timingSafeEqual` |
| `index.html` | Enforce CSP + add `frame-ancestors 'none'` + Razorpay SRI comment |

### Order of Operations

1. Run migration (creates RPC + adds UNIQUE constraint)
2. Update edge functions (webhook + verifyCallback)
3. Update index.html (CSP)
4. Deploy edge functions
