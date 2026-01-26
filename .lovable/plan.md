

## Summary

Update the Cashfree webhook handler to use the correct event type names from Cashfree's API documentation, handle user-dropped payments as failures, and skip refund handling as per your business requirements.

---

## Events to Enable in Cashfree Dashboard

### Payment Gateway Events (Select 6)

| Event | Purpose |
|-------|---------|
| `success payment` | Process successful one-time payments (power-ups, upgrades) |
| `failed payment` | Mark orders as failed |
| `user dropped payment` | Treat as payment failed (user abandoned checkout) |
| `dispute created` | Log and flag potential issues |
| `dispute updated` | Track dispute progress |
| `dispute closed` | Record resolution |

### Subscription Events (Select All 8)

| Event | Purpose |
|-------|---------|
| `subscription auth status` | Handle mandate activation (success/failure) |
| `subscription payment success` | Process renewals, add credits |
| `subscription payment failed` | Mark subscription as past_due |
| `subscription payment cancelled` | Handle cancelled recurring payments |
| `subscription status changed` | Track cancellation, expiry, pause states |
| `subscription card expiry reminder` | Log for future notification feature |
| `subscription refund status` | Acknowledge but no action (no refunds) |
| `subscription payment notification initiated` | Log upcoming payment attempts |

---

## Webhook URL Configuration

```
https://xylfnqrtzqfduutdcxvu.supabase.co/functions/v1/cashfree-webhook
```

---

## File to Modify

`supabase/functions/cashfree-webhook/index.ts`

---

## Event Type Mapping (Current vs Correct)

| Current Handler | Correct Cashfree Event Type |
|-----------------|----------------------------|
| `PAYMENT_SUCCESS` / `PAYMENT_SUCCESS_WEBHOOK` | `PAYMENT_SUCCESS_WEBHOOK` |
| `PAYMENT_FAILED` / `PAYMENT_FAILED_WEBHOOK` | `PAYMENT_FAILED_WEBHOOK` |
| (missing) | `PAYMENT_USER_DROPPED_WEBHOOK` |
| `SUBSCRIPTION_ACTIVATED` / `SUBSCRIPTION_NEW_ACTIVATION` | `SUBSCRIPTION_AUTH_STATUS` |
| `SUBSCRIPTION_PAYMENT_SUCCESS` / `SUBSCRIPTION_CHARGED` | `SUBSCRIPTION_PAYMENT_SUCCESS` |
| `SUBSCRIPTION_PAYMENT_FAILED` / `SUBSCRIPTION_PAYMENT_DECLINED` | `SUBSCRIPTION_PAYMENT_FAILED` |
| `SUBSCRIPTION_CANCELLED` / `SUBSCRIPTION_EXPIRED` | `SUBSCRIPTION_STATUS_CHANGED` |
| (missing) | `SUBSCRIPTION_PAYMENT_CANCELLED` |
| (missing) | `SUBSCRIPTION_CARD_EXPIRY_REMINDER` |
| (missing) | `SUBSCRIPTION_PAYMENT_NOTIFICATION_INITIATED` |
| (missing) | `DISPUTE_CREATED` / `DISPUTE_UPDATED` / `DISPUTE_CLOSED` |

---

## Implementation Changes

### 1. Add User Dropped Payment Handler (Treat as Failed)

```typescript
// User dropped = treat as payment failed
if (eventType === "PAYMENT_USER_DROPPED_WEBHOOK") {
  const orderId = data.order?.order_id;

  if (orderId) {
    await supabaseClient.rpc("mark_payment_failed", { p_order_id: orderId });
    console.log("Payment marked as failed (user dropped):", orderId);
  }

  return new Response(
    JSON.stringify({ success: true, status: "user_dropped_as_failed" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### 2. Update Subscription Activation Handler

Replace `SUBSCRIPTION_ACTIVATED` / `SUBSCRIPTION_NEW_ACTIVATION` with `SUBSCRIPTION_AUTH_STATUS`:

```typescript
if (eventType === "SUBSCRIPTION_AUTH_STATUS") {
  const cfSubscriptionId = data.cf_subscription_id;
  const customerId = data.customer_details?.customer_id;
  const planId = data.plan_details?.plan_id;
  const authStatus = data.authorization_details?.authorization_status;
  const paymentStatus = data.payment_status;

  // Only activate if authorization was successful
  if (authStatus === "ACTIVE" || paymentStatus === "SUCCESS") {
    // Activate subscription logic...
  } else {
    // Log failed authorization
    console.log("Subscription authorization failed:", cfSubscriptionId, authStatus);
    // Log event but don't activate
  }
}
```

### 3. Update Subscription Status Changed Handler

Replace `SUBSCRIPTION_CANCELLED` / `SUBSCRIPTION_EXPIRED` with `SUBSCRIPTION_STATUS_CHANGED`:

```typescript
if (eventType === "SUBSCRIPTION_STATUS_CHANGED") {
  const cfSubscriptionId = data.subscription_details?.cf_subscription_id || data.cf_subscription_id;
  const newStatus = data.subscription_details?.subscription_status;

  // Map Cashfree statuses to our internal statuses
  const statusMap: Record<string, string> = {
    "ACTIVE": "active",
    "CANCELLED": "canceled",
    "CUSTOMER_CANCELLED": "canceled",
    "EXPIRED": "canceled",
    "COMPLETED": "canceled",
    "ON_HOLD": "past_due",
    "CUSTOMER_PAUSED": "paused",
  };

  const internalStatus = statusMap[newStatus] || "active";

  // Update subscription status
  await supabaseClient
    .from("subscriptions")
    .update({ status: internalStatus, updated_at: new Date().toISOString() })
    .eq("cf_subscription_id", cfSubscriptionId);

  // Log the event
  await supabaseClient.from("cf_subscription_events").insert({
    cf_subscription_id: cfSubscriptionId,
    event_type: eventType,
    status: newStatus,
    raw_payload: payload,
  });
}
```

### 4. Add Subscription Payment Cancelled Handler

```typescript
if (eventType === "SUBSCRIPTION_PAYMENT_CANCELLED") {
  const cfSubscriptionId = data.cf_subscription_id;
  const cfPaymentId = data.cf_payment_id?.toString();

  // Log the cancellation
  await supabaseClient.from("cf_subscription_events").insert({
    cf_subscription_id: cfSubscriptionId,
    event_type: eventType,
    cf_payment_id: cfPaymentId,
    status: "payment_cancelled",
    raw_payload: payload,
  });

  console.log("Subscription payment cancelled:", cfSubscriptionId);
}
```

### 5. Add Card Expiry Reminder Handler (Log Only)

```typescript
if (eventType === "SUBSCRIPTION_CARD_EXPIRY_REMINDER") {
  const cfSubscriptionId = data.subscription_details?.cf_subscription_id || data.cf_subscription_id;
  const expiryDate = data.card_expiry_date;

  // Log for future notification feature
  await supabaseClient.from("cf_subscription_events").insert({
    cf_subscription_id: cfSubscriptionId,
    event_type: eventType,
    status: "card_expiring",
    raw_payload: payload,
  });

  console.log("Card expiry reminder for subscription:", cfSubscriptionId, "expires:", expiryDate);
}
```

### 6. Add Payment Notification Initiated Handler (Log Only)

```typescript
if (eventType === "SUBSCRIPTION_PAYMENT_NOTIFICATION_INITIATED") {
  const cfSubscriptionId = data.cf_subscription_id;

  // Log for tracking
  await supabaseClient.from("cf_subscription_events").insert({
    cf_subscription_id: cfSubscriptionId,
    event_type: eventType,
    status: "notification_sent",
    raw_payload: payload,
  });

  console.log("Payment notification initiated for subscription:", cfSubscriptionId);
}
```

### 7. Add Dispute Handlers (Log Only)

```typescript
if (eventType === "DISPUTE_CREATED" || eventType === "DISPUTE_UPDATED" || eventType === "DISPUTE_CLOSED") {
  const orderId = data.order?.order_id;
  const disputeId = data.dispute?.dispute_id;

  // Log dispute event (no automatic action)
  console.log(`Dispute ${eventType}:`, disputeId, "for order:", orderId);

  // Could add to a disputes table in future
}
```

### 8. Refund Events - Acknowledge Only (No Action)

```typescript
if (eventType === "REFUND_WEBHOOK" || eventType === "SUBSCRIPTION_REFUND_STATUS") {
  // We don't support refunds - just acknowledge
  console.log("Refund event received but not processed (refunds not supported):", eventType);
  return new Response(
    JSON.stringify({ success: true, message: "Refund events not processed" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Complete Updated Event Handler Structure

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT GATEWAY EVENTS                        │
├─────────────────────────────────────────────────────────────────┤
│ PAYMENT_SUCCESS_WEBHOOK     → Process payment, add credits      │
│ PAYMENT_FAILED_WEBHOOK      → Mark order as failed              │
│ PAYMENT_USER_DROPPED_WEBHOOK → Mark order as failed (same as ↑) │
│ DISPUTE_*                   → Log only (no action)              │
│ REFUND_WEBHOOK              → Acknowledge only (not supported)  │
├─────────────────────────────────────────────────────────────────┤
│                    SUBSCRIPTION EVENTS                           │
├─────────────────────────────────────────────────────────────────┤
│ SUBSCRIPTION_AUTH_STATUS         → Activate or log failure      │
│ SUBSCRIPTION_PAYMENT_SUCCESS     → Process renewal, add credits │
│ SUBSCRIPTION_PAYMENT_FAILED      → Mark as past_due             │
│ SUBSCRIPTION_PAYMENT_CANCELLED   → Log event                    │
│ SUBSCRIPTION_STATUS_CHANGED      → Update subscription status   │
│ SUBSCRIPTION_CARD_EXPIRY_REMINDER → Log for future notifications│
│ SUBSCRIPTION_PAYMENT_NOTIFICATION_INITIATED → Log event         │
│ SUBSCRIPTION_REFUND_STATUS       → Acknowledge only             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

1. **Backward Compatibility**: Keep existing event type checks alongside new ones during transition period in case Cashfree sends both formats.

2. **User Dropped = Failed**: Per your requirement, `PAYMENT_USER_DROPPED_WEBHOOK` will call the same `mark_payment_failed` RPC as regular payment failures.

3. **No Refund Processing**: Refund events will be acknowledged (HTTP 200) but no credits will be deducted or orders updated.

4. **Dispute Logging**: Disputes are logged to console for now. A future enhancement could add a `disputes` table to track these.

5. **Subscription Status Mapping**: Cashfree has multiple cancelled states (`CANCELLED`, `CUSTOMER_CANCELLED`, `EXPIRED`, `COMPLETED`) which all map to our internal `canceled` status.

---

## Cashfree Dashboard Configuration Summary

**Webhook URL:** `https://xylfnqrtzqfduutdcxvu.supabase.co/functions/v1/cashfree-webhook`

**Payment Gateway Events to Enable:**
- success payment
- failed payment
- user dropped payment
- dispute created
- dispute updated
- dispute closed

**Subscription Events to Enable:**
- All 8 events (subscription auth status, card expiry reminder, payment cancelled, payment failed, payment notification initiated, payment success, refund status, status changed)

