

# Remove Access Token Gate for Subscriptions

Open subscriptions to everyone — no invite code required.

## Changes

### 1. Frontend: `src/components/SubscribeConfirmationModal.tsx`
- Remove `AccessTokenInput` import and usage
- Remove `validatedTokenCode` state
- Remove `needsAccessToken` logic
- Remove `accessTokenCode` from `onConfirm` signature (keep `couponCode` only)
- Remove the disabled condition that checks for `validatedTokenCode`

### 2. Frontend: `src/hooks/useRazorpaySubscription.ts`
- Remove `access_token_code` from the `CreateSubscriptionParams` interface
- Stop passing it in the request body to `razorpay-create-order`

### 3. Backend: `supabase/functions/razorpay-create-order/index.ts`
- Remove the access token gate block (lines 88-107) that rejects requests without an access token
- Remove access token redemption logic (lines 181-187)
- Remove `access_token_code` from metadata and payment link notes

### 4. Backend: `supabase/functions/razorpay-verify-payment/index.ts`
- Remove access token redemption on payment verification (lines 227-233)

### 5. Frontend: `src/pages/Auth.tsx`
- Remove the "Need an invite code?" text and Telegram link from the signup form

### 6. Frontend: `src/components/AccessTokenInput.tsx`
- Keep file (still used by trial activation flow if needed), or remove if only used here

### 7. Pricing page and other subscribe flows
- Remove `accessTokenCode` parameter from any `createSubscription` calls

**Note**: The access token system itself (admin page, trial tokens) remains intact — only the subscription gate is removed.

