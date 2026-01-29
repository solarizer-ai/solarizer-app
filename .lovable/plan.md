
# Fix: Order Creation Failing Due to Missing Origin Header

## Problem Identified

The Cashfree order creation fails with error:
```
order_meta.return_url_invalid: Value received: null/payment-success?order_id=...
```

**Root Cause:** Line 225 in `cashfree-create-order/index.ts` uses `req.headers.get("origin")` to build the return URL. When called via Supabase client, the `Origin` header may not be forwarded, resulting in `null`.

## Solution

Use a multi-fallback approach to reliably get the origin:

1. **Primary**: Accept `returnUrl` from request body (most reliable)
2. **Fallback 1**: `Origin` header
3. **Fallback 2**: `Referer` header (extract origin from it)
4. **Fallback 3**: Hardcoded production URL (safety net)

---

## Implementation

### 1. Update Edge Function: `supabase/functions/cashfree-create-order/index.ts`

**Changes:**

1. Add `returnUrl` to the request interface:
```typescript
interface CreateOrderRequest {
  orderType: "subscription" | "power_up";
  plan?: "launch" | "pro" | "business";
  billingPeriod?: "monthly";
  creditsAmount?: number;
  billingData?: BillingData;
  returnUrl?: string;  // NEW: Frontend sends origin URL
}
```

2. Build robust origin detection:
```typescript
// Get origin with fallbacks
const getOriginUrl = (): string => {
  // 1. Explicit returnUrl from request body
  if (body.returnUrl) {
    return body.returnUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // 2. Origin header
  const origin = req.headers.get("origin");
  if (origin && origin !== "null") {
    return origin;
  }
  
  // 3. Referer header (extract origin)
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {}
  }
  
  // 4. Fallback to production URL
  return "https://solarizer-app.lovable.app";
};

const originUrl = getOriginUrl();
```

3. Use in order_meta:
```typescript
order_meta: {
  return_url: `${originUrl}/payment-success?order_id=${orderId}`,
  notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
},
```

### 2. Update Frontend: `src/hooks/useCashfreeCheckout.ts`

Send `returnUrl` in the request:
```typescript
const response = await supabase.functions.invoke<CreateOrderResponse>("cashfree-create-order", {
  body: {
    ...params,
    returnUrl: window.location.origin, // Always send origin
  },
});
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/cashfree-create-order/index.ts` | Add `returnUrl` to interface, implement fallback logic |
| `src/hooks/useCashfreeCheckout.ts` | Include `window.location.origin` in request body |

---

## Technical Details

**Why this happens:**
- Supabase client makes requests to edge functions
- CORS preflight may strip the Origin header in certain scenarios
- Edge functions don't always receive browser context headers

**Why this fix works:**
- Frontend explicitly sends its origin (100% reliable)
- Multiple fallbacks ensure it never fails
- Production URL as last resort prevents complete failure
