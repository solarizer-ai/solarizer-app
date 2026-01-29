
# Fail Audit Endpoint & Report Locking

## Overview

This plan implements:
1. **New `fail-audit` edge function** - n8n calls this when a workflow errors out
2. **Credit refund** - Automatically refunds credits based on the audit's `nloc_count`
3. **Failed report popup** - Shows a toast notification when user opens a failed report
4. **Report locking** - Prevents modifications after `complete-audit` or `fail-audit` is called

---

## Architecture Flow

```text
n8n Workflow Error
        │
        ▼
┌─────────────────────┐
│  fail-audit         │
│  Edge Function      │
│  (server-to-server) │
└─────────────────────┘
        │
        ├──► Update audit status = 'failed'
        ├──► Set is_locked = true
        └──► Call refund_credits(user_id, nloc_count)
                    │
                    ▼
            Credits restored to user
```

---

## Implementation Plan

### 1. Database Migration

Add an `is_locked` column to the `audits` table to prevent modifications after completion or failure:

```sql
-- Add is_locked column to audits table
ALTER TABLE public.audits 
ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for faster lookups on locked audits
CREATE INDEX idx_audits_is_locked ON public.audits(is_locked) WHERE is_locked = true;
```

### 2. New Edge Function: `supabase/functions/fail-audit/index.ts`

Create a new edge function that:
- Validates `x-callback-secret` header (same pattern as `complete-audit`)
- Accepts `audit_id` and optional `error_message`
- Fetches audit to get `user_id` and `nloc_count` for refund
- Calls `refund_credits` RPC to restore credits
- Updates audit status to `'failed'` and sets `is_locked = true`

**Request interface:**
```typescript
interface FailAuditRequest {
  audit_id: string;
  error_message?: string;  // Optional error details for logging
}
```

**Response:**
```typescript
{
  success: true,
  audit_id: string,
  credits_refunded: number
}
```

### 3. Update `complete-audit` Edge Function

Modify the existing `complete-audit` function to also set `is_locked = true` when completing:

```typescript
// In updateData object
const updateData: Record<string, unknown> = {
  security_score,
  grade: calculatedGrade,
  status,
  is_locked: true,  // ADD THIS
  updated_at: new Date().toISOString(),
};
```

### 4. Update `save-finding` and `complete-audit` to Check Lock

Add a lock check at the start of these functions to reject updates to locked audits:

```typescript
// Check if audit is locked
const { data: auditCheck, error: checkError } = await supabase
  .from('audits')
  .select('is_locked')
  .eq('id', audit_id)
  .single();

if (auditCheck?.is_locked) {
  console.log(`Audit ${audit_id} is locked, rejecting update`);
  return new Response(
    JSON.stringify({ error: 'Audit is locked', already_complete: true }),
    { status: 409, headers: corsHeaders }
  );
}
```

### 5. Update Report Page: Show Failed Notification

Modify `src/pages/Report.tsx` to:
- Detect `status === 'failed'` when audit loads
- Show a toast notification with the failure message and credit refund info
- Display a visual indicator (banner) on failed reports

**Add to Report.tsx:**
```tsx
// Effect to show failed audit notification
useEffect(() => {
  if (currentAudit?.status === 'failed') {
    toast.error("Analysis Failed", {
      description: "This analysis encountered an error. Your credits have been automatically refunded.",
      duration: 8000,
    });
  }
}, [currentAudit?.status, currentAudit?.id]);
```

**Add failed state banner:**
```tsx
{currentAudit?.status === 'failed' && (
  <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
    <AlertTriangle className="w-5 h-5 text-destructive" />
    <div>
      <p className="text-sm font-medium text-destructive">Analysis Failed</p>
      <p className="text-xs text-muted-foreground">
        This analysis encountered an error. Your credits have been automatically refunded.
      </p>
    </div>
  </div>
)}
```

### 6. Update ScanContext for Failed Status

Modify `src/contexts/ScanContext.tsx` to handle the `failed` status in realtime updates:

```typescript
// In the audit status channel handler
if (updatedAudit.status === 'secured' || updatedAudit.status === 'issues' || updatedAudit.status === 'failed') {
  cleanupChannels();
  setIsScanning(false);
  
  if (updatedAudit.status === 'failed') {
    toast.error("Analysis Failed", {
      description: "Something went wrong. Your credits have been refunded.",
    });
  }
}
```

---

## Edge Function Config

Add to `supabase/config.toml`:

```toml
[functions.fail-audit]
verify_jwt = false
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/fail-audit/index.ts` | Create | New endpoint for n8n to report failures |
| `supabase/functions/complete-audit/index.ts` | Modify | Add `is_locked = true` on completion |
| `supabase/functions/save-finding/index.ts` | Modify | Check lock before saving |
| `src/pages/Report.tsx` | Modify | Add failed state banner + toast notification |
| `src/contexts/ScanContext.tsx` | Modify | Handle failed status in realtime |
| `supabase/config.toml` | Modify | Add fail-audit function config |
| Migration | Create | Add `is_locked` column |

---

## n8n Integration

n8n workflow should call the fail-audit endpoint when an error occurs:

```javascript
// Example n8n HTTP Request node configuration
{
  method: "POST",
  url: "{{$env.SUPABASE_URL}}/functions/v1/fail-audit",
  headers: {
    "Content-Type": "application/json",
    "x-callback-secret": "{{$env.N8N_CALLBACK_SECRET}}"
  },
  body: {
    audit_id: "{{$json.audit_id}}",
    error_message: "{{$json.error_message || 'Unknown error'}}"
  }
}
```

---

## Technical Details

**Lock enforcement strategy:**
- Lock is set atomically with status update
- `save-finding` and `complete-audit` check lock before any modifications
- This prevents race conditions where n8n might send late findings after completion

**Refund logic:**
- Uses existing `refund_credits` RPC function
- Refunds based on `nloc_count` stored in the audit record
- Falls back to 0 if `nloc_count` is null (shouldn't happen but safe)

**Idempotency:**
- If `fail-audit` is called on an already-locked audit, it returns success with `already_locked: true`
- Prevents duplicate refunds

