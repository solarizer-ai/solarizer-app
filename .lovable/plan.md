

# Apply 3 Admin Migrations + Wire Up Admin Dashboard

## Overview
The 3 uploaded SQL files need to be applied as database migrations, and the corresponding frontend (admin routes, pages, sidebar, and components) needs to be created.

## Current State
- **Database**: No `coupons`, `coupon_redemptions` tables. No admin RPC functions (`admin_get_users`, `admin_get_audits`, `admin_get_stats`, `admin_adjust_credits`, `validate_coupon`). No admin RLS policies on existing tables.
- **Frontend**: No admin routes in `App.tsx`. No admin pages exist on disk (`AdminOverviewPage`, `AdminAuditsPage`, `AdminUsersPage`, `AdminCouponsPage`, `AdminCreditsPage`, `AdminUserDetailPage`, `AdminAuditDetailPage`). No `AdminRoute` guard component. No `useAdminRole` hook. No admin section in `DashboardSidebar`.

## Part A: Database Migrations (3 migrations)

### Migration 1 — Coupons Tables (`01_admin_coupons.sql`)
- Create `coupons` table with RLS
- Create `coupon_redemptions` table with RLS
- Admin-only management policy + public read of active coupons
- **One issue to fix**: The `CHECK` constraints on `discount_type` and `discount_value` should use a validation trigger instead per project guidelines. However, these are immutable checks (not time-based), so CHECK constraints are acceptable here.

### Migration 2 — Admin RLS Policies (`02_admin_rls.sql`)
- Add `admins_select_all_*` SELECT policies on 7 tables: audits, audit_orchestration, credit_txns, subscriptions, nloc_credits, payment_orders, profiles, findings
- Uses direct `user_roles` lookup (consistent pattern, though `has_role()` function exists and would be slightly better)

### Migration 3 — Admin RPCs (`03_admin_rpcs.sql`)
- `admin_get_users()` — paginated user list with search, joins profiles/subscriptions/credits/audits
- `admin_get_audits()` — paginated audit list with status/user/search filters, joins orchestration
- `admin_get_stats()` — dashboard overview stats (total users, audits, revenue, etc.)
- `admin_adjust_credits()` — add/deduct credits for any user with audit trail
- `validate_coupon()` — user-callable, validates coupon code before checkout
- `increment_coupon_used_count()` — called by payment edge functions after redemption

## Part B: Frontend Implementation

### 1. Create `src/hooks/useAdminRole.ts`
- Queries `user_roles` table for current user
- Returns `{ isAdmin, isLoading }`

### 2. Create `src/components/AdminRoute.tsx`
- Route guard that checks `useAdminRole()`
- Shows nothing while loading, redirects to `/` if not admin

### 3. Create Admin Pages

| Page | Path | Description |
|------|------|-------------|
| `AdminOverviewPage` | `/dashboard/admin` | Calls `admin_get_stats()`, displays cards for total users, audits, revenue, active audits |
| `AdminUsersPage` | `/dashboard/admin/users` | Calls `admin_get_users()`, searchable table with credit adjust dialog |
| `AdminUserDetailPage` | `/dashboard/admin/users/:userId` | Detailed view of a single user (subscription, credits, audits, txn history) |
| `AdminAuditsPage` | `/dashboard/admin/audits` | Calls `admin_get_audits()`, filterable table with status/orchestration columns |
| `AdminAuditDetailPage` | `/dashboard/admin/audits/:auditId` | Detailed view of a single audit (orchestration state, findings) |
| `AdminCouponsPage` | `/dashboard/admin/coupons` | CRUD for coupons, redemptions drawer |
| `AdminCreditsPage` | `/dashboard/admin/credits` | Credit reconciliation view using `cli_reconcile_credits()` |

### 4. Update `src/App.tsx`
Add admin routes under `/dashboard/admin/*` wrapped in `AdminRoute`:
```text
/dashboard/admin          -> AdminOverviewPage
/dashboard/admin/users    -> AdminUsersPage
/dashboard/admin/users/:userId -> AdminUserDetailPage
/dashboard/admin/audits   -> AdminAuditsPage
/dashboard/admin/audits/:auditId -> AdminAuditDetailPage
/dashboard/admin/coupons  -> AdminCouponsPage
/dashboard/admin/credits  -> AdminCreditsPage
```

### 5. Update `src/components/DashboardSidebar.tsx`
- Add an "ADMIN" nav group (conditionally rendered when `useAdminRole().isAdmin` is true)
- Links: Overview, Users, Audits, Coupons, Credits

### 6. Create `src/components/CouponInput.tsx`
- Reusable input component for checkout flows
- Calls `validate_coupon()` RPC, shows discount preview
- Used by subscription/power-up purchase flows

## Part C: Migration Adjustments Needed

A few improvements to the uploaded SQL before applying:

1. **Use `has_role()` instead of direct queries** in admin RLS policies (Migration 2). The project already has a `has_role()` SECURITY DEFINER function that avoids recursive RLS. The uploaded policies query `user_roles` directly which works but is inconsistent.

2. **Add `search_path` to RPCs** (Migration 3). The existing project functions all use `SET search_path TO 'public'` but some of the uploaded RPCs lack this.

3. **`admin_get_audits` column ambiguity**: The function returns columns named `status`, `findings_count` etc. that also exist in the joined `audit_orchestration` table — these need explicit table prefixes (some are already there but `ao.status` conflicts with the return column name).

## File Summary

| Action | File |
|--------|------|
| Migration | Create coupons + coupon_redemptions tables with RLS |
| Migration | Add admin SELECT policies on 8 existing tables |
| Migration | Create 6 admin/coupon RPC functions |
| Create | `src/hooks/useAdminRole.ts` |
| Create | `src/components/AdminRoute.tsx` |
| Create | `src/pages/dashboard/admin/AdminOverviewPage.tsx` |
| Create | `src/pages/dashboard/admin/AdminUsersPage.tsx` |
| Create | `src/pages/dashboard/admin/AdminUserDetailPage.tsx` |
| Create | `src/pages/dashboard/admin/AdminAuditsPage.tsx` |
| Create | `src/pages/dashboard/admin/AdminAuditDetailPage.tsx` |
| Create | `src/pages/dashboard/admin/AdminCouponsPage.tsx` |
| Create | `src/pages/dashboard/admin/AdminCreditsPage.tsx` |
| Create | `src/components/CouponInput.tsx` |
| Modify | `src/App.tsx` (add admin routes) |
| Modify | `src/components/DashboardSidebar.tsx` (add admin nav group) |

