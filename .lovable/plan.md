

# Fix Admin Dashboard Inconsistencies

## Issues Found (6 total)

### Bug 1: `admin_get_audits` RPC returns `audit_status` but frontend reads `status`
The RPC aliases the audit status column as `audit_status` to avoid collision with the orchestration `status`. But all 3 frontend pages (`AdminAuditsPage`, `AdminUserDetailPage`, `AdminOverviewPage`) access `a.status` / `audit.status` -- which is `undefined`.

**Fix**: Update all 3 frontend files to use `a.audit_status` instead of `a.status`.

### Bug 2: `findings_count` column in audits table is always 0
Database query confirms: every audit has `findings_count = 0` while actual findings exist (e.g., 239 findings but `findings_count` shows 0). The `AdminAuditDetailPage` shows this stale value in the "Audit Details" card.

**Fix**: Replace `audit?.findings_count` with the real count from the `findingCounts` query (sum of all severities) in `AdminAuditDetailPage`.

### Bug 3: Credit Adjustment silently fails for users without `nloc_credits` row
2 users have no `nloc_credits` row. The `admin_adjust_credits` RPC does `UPDATE ... WHERE user_id = X` which affects 0 rows, then `INSERT INTO credit_txns SELECT ... FROM nloc_credits WHERE user_id = X` also returns nothing.

**Fix**: Update the RPC to `INSERT ... ON CONFLICT DO NOTHING` before the UPDATE, ensuring a row exists.

### Bug 4: `credit_txns` has no FK to `profiles`, breaking admin adjustment history
`AdminCreditsPage` does `.select("*, profiles(display_name, email)")` but `credit_txns.user_id` has no foreign key to `profiles`. PostgREST cannot resolve the join, so the user email column shows `tx.user_id` (a UUID) instead of the email.

**Fix**: Add a FK from `credit_txns.user_id` to `profiles.user_id` -- but `profiles.user_id` is not a primary key or unique column. Instead, change the query to fetch profiles separately via admin RPC, or simply use a subquery approach. The cleanest fix: use a dedicated admin RPC, or fetch user emails client-side. I'll update the query to avoid the broken join and instead manually look up the profile.

### Bug 5: `AdminUserDetailPage` uses `a.status` from RPC but should use `a.audit_status`
Same as Bug 1 but specifically the user detail page's audit list. Status badges show empty/unstyled.

**Fix**: Already covered in Bug 1 fix.

### Bug 6: Findings count mismatch in `admin_get_audits` RPC
The RPC returns `a.findings_count` from the audits table (always 0). Should return the actual count from the findings table.

**Fix**: Update the RPC to use a subquery `(SELECT COUNT(*) FROM findings WHERE audit_id = a.id)` instead of `a.findings_count`.

---

## Implementation Plan

### Step 1: Database Migration
Update the `admin_adjust_credits` and `admin_get_audits` RPCs:

- `admin_adjust_credits`: Add `INSERT INTO nloc_credits (user_id, credits_remaining) VALUES (p_target_user_id, 0) ON CONFLICT (user_id) DO NOTHING` at the start
- `admin_get_audits`: Replace `a.findings_count` with `(SELECT COUNT(*)::INT FROM public.findings f WHERE f.audit_id = a.id) AS findings_count`

### Step 2: Fix `AdminAuditsPage.tsx`
Change `a.status` references to `a.audit_status`:
- Status badge: `statusColor[a.audit_status]`
- Display text: `a.audit_status`

### Step 3: Fix `AdminOverviewPage.tsx`
Change `audit.status` to `audit.audit_status` in the recent audits table.

### Step 4: Fix `AdminUserDetailPage.tsx`
Change `a.status` to `a.audit_status` in the audits table.

### Step 5: Fix `AdminAuditDetailPage.tsx`
Replace the hardcoded `audit?.findings_count` with the actual computed count from the `findingCounts` query.

### Step 6: Fix `AdminCreditsPage.tsx`
Replace the broken PostgREST join (`.select("*, profiles(display_name, email)")`) with a working approach -- fetch credit_txns normally, then batch-lookup profiles by user_id.

---

## Files Changed

| File | Change |
|------|--------|
| New migration SQL | Fix `admin_adjust_credits` (upsert nloc_credits), fix `admin_get_audits` (real findings count) |
| `src/pages/dashboard/admin/AdminAuditsPage.tsx` | `a.status` to `a.audit_status` |
| `src/pages/dashboard/admin/AdminOverviewPage.tsx` | `audit.status` to `audit.audit_status` |
| `src/pages/dashboard/admin/AdminUserDetailPage.tsx` | `a.status` to `a.audit_status` |
| `src/pages/dashboard/admin/AdminAuditDetailPage.tsx` | Use computed findings count |
| `src/pages/dashboard/admin/AdminCreditsPage.tsx` | Fix broken profiles join |
