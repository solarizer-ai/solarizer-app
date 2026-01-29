
# Enhanced Cashfree Checkout with Billing Information

## Overview

Based on Cashfree API research, for standard Payment Gateway orders (not One Click Checkout/ecommerce), the checkout page primarily displays `customer_name` and collects payment details. Address information is primarily used for:
- Invoice generation on our side
- GST/tax compliance
- Customer records

This plan will:
1. **Collect billing information** before checkout (phone required, address for invoicing)
2. **Store billing profile locally** for future purchases and invoice generation
3. **Send complete customer_details to Cashfree** including real phone number
4. **Use order_tags** to pass billing/address metadata to Cashfree for record-keeping

---

## Cashfree API Support Confirmed

**customer_details** (sent in request):
- `customer_id` (required)
- `customer_phone` (required) - **currently using dummy value**
- `customer_email` (optional)
- `customer_name` (optional) - **displayed on checkout page**

**order_tags** (optional, for metadata):
- Can store up to 10 key-value pairs
- Good for passing address info for records/invoicing

---

## Database Schema

Create `billing_profiles` table:

```sql
CREATE TABLE billing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Contact (required for Cashfree)
  phone VARCHAR(20) NOT NULL,
  
  -- Primary Address (required for invoicing)
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(2) DEFAULT 'US' NOT NULL,
  
  -- Separate Billing Address (optional)
  use_different_billing_address BOOLEAN DEFAULT FALSE,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(2) DEFAULT 'US',
  
  -- Business/Tax Info (optional)
  tax_id VARCHAR(50),
  company_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE billing_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own billing profile"
  ON billing_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## UI Component: BillingInfoModal

**Location:** `src/components/BillingInfoModal.tsx`

**Behavior:**
- Always shown before payment
- Pre-fills existing data if profile exists
- Shows "Confirm Details" header if data exists, "Enter Billing Details" if new
- User must confirm or update before proceeding

**Form Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Confirm Billing Details                    [X]             │
├─────────────────────────────────────────────────────────────┤
│  ACCOUNT INFORMATION (read-only)                            │
│  Name:  John Doe                                            │
│  Email: john@example.com                                    │
├─────────────────────────────────────────────────────────────┤
│  CONTACT                                                    │
│  Phone Number*: [+1 555-123-4567          ]                 │
├─────────────────────────────────────────────────────────────┤
│  ADDRESS                                                    │
│  Address Line 1*: [123 Main Street              ]           │
│  Address Line 2:  [Suite 100                    ]           │
│  City*:           [New York    ]  State*: [NY         ]     │
│  Postal Code*:    [10001       ]  Country*: [US       ]     │
├─────────────────────────────────────────────────────────────┤
│  ☐ Use different billing address                            │
│                                                             │
│  (When checked - additional fields appear)                  │
│  BILLING ADDRESS                                            │
│  Address Line 1*: [456 Corporate Blvd           ]           │
│  Address Line 2:  [Floor 10                     ]           │
│  City*:           [Chicago     ]  State*: [IL         ]     │
│  Postal Code*:    [60601       ]  Country*: [US       ]     │
├─────────────────────────────────────────────────────────────┤
│  BUSINESS DETAILS (Optional)                                │
│  Company Name:    [Acme Corporation             ]           │
│  Tax ID (GST):    [12-3456789                   ]           │
├─────────────────────────────────────────────────────────────┤
│  [Cancel]                          [Confirm & Pay]          │
└─────────────────────────────────────────────────────────────┘
```

**Fields Summary:**

| Field | Required | Notes |
|-------|----------|-------|
| Name | Display only | From profile |
| Email | Display only | From profile |
| Phone | **Yes** | Required by Cashfree |
| Address Line 1 | **Yes** | For invoicing |
| Address Line 2 | No | |
| City | **Yes** | For invoicing |
| State | **Yes** | For invoicing |
| Postal Code | **Yes** | For invoicing |
| Country | **Yes** | Default: US |
| Use Different Billing | No | Toggle |
| Billing Address* | **Yes if toggle on** | Separate billing address |
| Company Name | No | For business invoices |
| Tax ID | No | GST/VAT for invoices |

---

## Implementation Files

### 1. Database Migration
Create `billing_profiles` table with RLS

### 2. New Hook: `src/hooks/useBillingProfile.ts`
```typescript
// Fetch, create, update billing profile
// Uses React Query for caching
export function useBillingProfile() {
  // ... query and mutation logic
}
```

### 3. New Component: `src/components/BillingInfoModal.tsx`
- Form with validation (react-hook-form + zod)
- Pre-fills existing data
- Saves to database on submit
- Returns billing data on confirm

### 4. Update: `src/hooks/useCashfreeCheckout.ts`
```typescript
interface CreateOrderParams {
  orderType: "subscription" | "power_up";
  plan?: "launch" | "pro" | "business";
  creditsAmount?: number;
  billingData?: BillingData;  // NEW: Pass billing info
}
```

### 5. Update: `src/components/PurchasePowerUpModal.tsx`
- Integrate BillingInfoModal before checkout
- Pass billing data to checkout

### 6. Update: `src/pages/Pricing.tsx`
- Show BillingInfoModal before subscription purchase
- Pass billing data to checkout

### 7. Update: `supabase/functions/cashfree-create-order/index.ts`
```typescript
// Accept billing data in request
const { orderType, plan, creditsAmount, billingData } = body;

// Send complete customer_details
customer_details: {
  customer_id: user.id,
  customer_email: profile?.email || user.email,
  customer_name: profile?.display_name || "Customer",
  customer_phone: billingData?.phone || "9999999999",
},
// Store address in order_tags for reference
order_tags: {
  billing_city: billingData?.city,
  billing_state: billingData?.state,
  billing_country: billingData?.country,
  company_name: billingData?.company_name || "",
  tax_id: billingData?.tax_id || "",
}
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| Migration | Create | `billing_profiles` table with RLS |
| `src/hooks/useBillingProfile.ts` | Create | Hook for billing profile CRUD |
| `src/components/BillingInfoModal.tsx` | Create | Billing confirmation/edit modal |
| `src/hooks/useCashfreeCheckout.ts` | Modify | Accept billing data parameter |
| `src/components/PurchasePowerUpModal.tsx` | Modify | Show billing modal first |
| `src/pages/Pricing.tsx` | Modify | Show billing modal before subscription |
| `supabase/functions/cashfree-create-order/index.ts` | Modify | Send real phone, use order_tags |

---

## User Flow

1. User clicks "Subscribe" or "Purchase Credits"
2. **BillingInfoModal appears**
   - If existing profile: "Confirm Your Details" with pre-filled data
   - If new: "Enter Billing Details" with empty form
3. User confirms/updates information
4. Data saved to `billing_profiles`
5. Checkout initiated with real customer data
6. Cashfree shows customer's actual name
7. Payment processed with proper billing records

---

## Benefits

- **Customer name displayed** on Cashfree checkout (not just phone)
- **Real phone number** sent for payment verification
- **Billing data saved** for future purchases (one-click confirm)
- **Invoice-ready** with address and tax ID
- **Professional checkout** with complete information
