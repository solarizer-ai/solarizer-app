

# Dashboard Sidebar & Page Restructuring

Reorganize the sidebar navigation, merge billing with subscription, move docs into the sidebar layout, and clean up redundant sections.

---

## Changes Overview

### 1. Sidebar Navigation Restructure

New sidebar groups:

```text
OVERVIEW
  Dashboard
  Analyses
  Credit Activity    <-- moved from Analytics

MANAGE
  API Keys
  Sharing            <-- moved from Account
  Billing            <-- merged billing + subscription

ACCOUNT
  Profile
  Security

[Documentation]      <-- stays at bottom, now routes to /dashboard/docs
[User footer]
```

Removed items:
- "Usage" (redundant -- stats already on dashboard home)
- "Integrations" (CLI-first, no GitHub integration needed)
- "Subscription" (merged into Billing)
- Entire "ANALYTICS" section label

### 2. Merge Billing + Subscription into one page

The current `/dashboard/billing` (transaction history) and `/dashboard/subscription` (plan management, credits) will be combined into a single `/dashboard/billing` page with this structure:

- Section 1: Current Plan card (from SubscriptionPage)
- Section 2: Plan Selector (from SubscriptionPage)
- Section 3: Credits card (from SubscriptionPage)
- Section 4: Transaction History (from BillingPage)
- All modals (PowerUp, Cancel, Upgrade, Downgrade) preserved

The old `/dashboard/subscription` route will redirect to `/dashboard/billing`.

### 3. Documentation inside sidebar layout

Move `/docs` to `/dashboard/docs` so it renders inside the `DashboardLayout` with the sidebar visible. The existing `/docs` route will still work for unauthenticated users (keep as-is), but add a new dashboard route that renders the same content without Header/Footer.

### 4. Remove greeting exclamation mark

In `DashboardHome.tsx`, change line 89 from:
```
{getTimeBasedGreeting()}{displayName ? `, ${displayName}` : ""}!
```
to:
```
{getTimeBasedGreeting()}{displayName ? `, ${displayName}` : ""}
```

### 5. Remove unused routes and imports

- Remove `/dashboard/usage` route and `UsagePage` import from `App.tsx`
- Remove `/dashboard/integrations` route and `IntegrationsPage` import from `App.tsx`
- Remove `/dashboard/subscription` route (add redirect to `/dashboard/billing`)
- Add `/dashboard/docs` route

---

## Technical Details

### Files to modify

| File | Change |
|------|--------|
| `src/components/DashboardSidebar.tsx` | Restructure `navGroups` array, change docs link to `/dashboard/docs` |
| `src/pages/dashboard/DashboardHome.tsx` | Remove `!` from greeting (line 89) |
| `src/pages/dashboard/BillingPage.tsx` | Merge in all SubscriptionPage content (plan card, selector, credits, modals) + keep transaction history below |
| `src/App.tsx` | Remove usage/integrations/subscription routes, add docs route, add subscription redirect |
| `src/pages/dashboard/DocsPage.tsx` | **New file** -- renders Docs content (tabs, FAQ, guides) without Header/Footer |

### Files unchanged
- `src/pages/Docs.tsx` -- kept for unauthenticated `/docs` route
- `src/pages/dashboard/SubscriptionPage.tsx` -- can be deleted later, but not breaking (redirect handles it)
- All hooks, components, modals -- no changes needed
