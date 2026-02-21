
# Dashboard Redesign: Sidebar-First Console Layout

Transform the authenticated experience from separate pages with a floating header into a unified console with a persistent left sidebar -- inspired by Claude Console's layout. Keep all existing visual effects (glows, hover overlays, colorful accents).

## Architecture Change

Currently, each protected page (Dashboard, Audits, Settings, Billing) is a standalone page with its own Header + Footer. The new design introduces a shared console shell with a persistent sidebar, replacing the floating pill header for authenticated users.

```text
+-------------------+------------------------------------------+
| SOLARIZER         |                                          |
|                   |  Content area (changes per route)         |
| OVERVIEW          |                                          |
|   Dashboard       |  e.g. Dashboard stats, audit cards,      |
|   Analyses        |  severity breakdown, trend chart          |
|                   |                                          |
| ANALYTICS         |                                          |
|   Usage           |                                          |
|   Credit Activity |                                          |
|                   |                                          |
| MANAGE            |                                          |
|   API Keys        |                                          |
|   Integrations    |                                          |
|   Billing         |                                          |
|                   |                                          |
| ACCOUNT           |                                          |
|   Profile         |                                          |
|   Security        |                                          |
|   Subscription    |                                          |
|   Sharing         |                                          |
|                   |                                          |
| [Docs]            |                                          |
| [User avatar]     |                                          |
+-------------------+------------------------------------------+
```

## Sidebar Navigation Groups

| Group | Items | Route |
|-------|-------|-------|
| OVERVIEW | Dashboard | `/dashboard` |
| | Analyses | `/dashboard/analyses` |
| ANALYTICS | Usage (DashboardStats + SecurityTrend) | `/dashboard/usage` |
| | Credit Activity (CreditActivityLog) | `/dashboard/credits` |
| MANAGE | API Keys (ApiKeyManager) | `/dashboard/api-keys` |
| | Integrations (GitHubIntegration) | `/dashboard/integrations` |
| | Billing (BillingHistory) | `/dashboard/billing` |
| ACCOUNT | Profile | `/dashboard/profile` |
| | Security | `/dashboard/security` |
| | Subscription (Plans + Credits) | `/dashboard/subscription` |
| | Sharing | `/dashboard/sharing` |

## What Changes

### New Files

**`src/components/DashboardSidebar.tsx`**
- Uses the existing shadcn `Sidebar` component
- Logo + "Solarizer" brand at top
- Grouped nav items with section labels (OVERVIEW, ANALYTICS, MANAGE, ACCOUNT)
- Uses `NavLink` with `activeClassName` for route highlighting
- Icons for each item (LayoutDashboard, FileSearch, BarChart3, Coins, Key, Link2, Receipt, User, Shield, CreditCard, Users)
- Bottom: Documentation link + user avatar/name with click-to-expand for logout
- Collapsible to icon-only "mini" mode (w-14)
- Mobile: Sheet-based overlay sidebar with hamburger trigger

**`src/layouts/DashboardLayout.tsx`**
- Wraps all authenticated routes
- `SidebarProvider` + `DashboardSidebar` + main content area
- No Header or Footer -- the sidebar replaces both
- Content area has its own scroll, padded with `px-8 py-6`
- A small `SidebarTrigger` button in the top-left of the content area for collapse/expand

**`src/pages/dashboard/DashboardHome.tsx`**
- Extracted from current `Index.tsx`: greeting, stats, audit cards (4), severity breakdown, security trend
- Keeps all existing glows, hover overlays, and colorful accents
- Removes Header/Footer (handled by layout)
- Removes CLI banner (sidebar makes it obvious)

**`src/pages/dashboard/AnalysesPage.tsx`**
- Content from current `Audits.tsx` (search, filters, full audit grid)
- Removes Header/Footer

**`src/pages/dashboard/UsagePage.tsx`**
- Full-width DashboardStats + SecurityTrend + SeverityBreakdown
- Analytics-focused view

**`src/pages/dashboard/CreditActivityPage.tsx`**
- Full-width CreditActivityLog component

**`src/pages/dashboard/ApiKeysPage.tsx`**
- Full-width ApiKeyManager component (extracted from Settings security tab)

**`src/pages/dashboard/IntegrationsPage.tsx`**
- Full-width GitHubIntegration component

**`src/pages/dashboard/BillingPage.tsx`**
- Content from current `BillingHistory.tsx` page, minus Header/Footer/back button

**`src/pages/dashboard/ProfilePage.tsx`**
- Profile form + logout button (from Settings profile tab)

**`src/pages/dashboard/SecurityPage.tsx`**
- Password + 2FA settings (from Settings security tab, minus ApiKeyManager which is its own page)

**`src/pages/dashboard/SubscriptionPage.tsx`**
- Current plan card + plan selector + credits + power-up (from Settings subscription tab)

**`src/pages/dashboard/SharingPage.tsx`**
- Sharing settings (from Settings sharing tab)

### Modified Files

**`src/App.tsx`**
- Wrap all `/dashboard/*` routes under a `DashboardLayout`
- Old `/settings`, `/audits`, `/billing` routes redirect to their new `/dashboard/*` equivalents
- Public routes (Home, Pricing, Docs, Auth) keep the floating header as-is

**`src/components/Header.tsx`**
- Remove "Dashboard" from nav links (sidebar handles it)
- Keep header only for public/unauthenticated pages

**`src/pages/Index.tsx`**
- Becomes a thin wrapper that redirects to `/dashboard` or renders `DashboardHome`

### Unchanged Files (preserved as-is)
- All existing components (AuditCard, DashboardStats, SeverityBreakdown, SecurityTrend, CreditBalance, etc.) -- they just get used inside new page wrappers
- All hooks, edge functions, types, UI components
- Public pages (Home, Pricing, Docs, Auth, etc.)
- All visual effects: hover glows, gradient overlays, colorful severity bars, card shadows

## Sidebar Styling

- Background: `bg-[hsl(0,0%,4%)]` (slightly darker than main bg)
- Border: `border-r border-[hsl(0,0%,10%)]`
- Section labels: `text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold`
- Active item: `bg-primary/10 text-foreground font-medium border-l-2 border-l-primary`
- Hover: `hover:bg-muted/50 hover:text-foreground`
- Logo area: Solarizer logo + name, same styling as current header
- User area at bottom: avatar circle + name + email, clickable to profile
- Collapse trigger: `PanelLeftClose` / `PanelLeft` icon

## Mobile Behavior

- Sidebar hidden by default on screens < `md`
- Hamburger menu button in top-left of content area
- Opens as a Sheet overlay (existing shadcn Sheet pattern)
- Auto-closes on navigation

## Routing Strategy

Use nested routes under `/dashboard`:

```text
/dashboard              -> DashboardHome
/dashboard/analyses     -> AnalysesPage
/dashboard/usage        -> UsagePage
/dashboard/credits      -> CreditActivityPage
/dashboard/api-keys     -> ApiKeysPage
/dashboard/integrations -> IntegrationsPage
/dashboard/billing      -> BillingPage
/dashboard/profile      -> ProfilePage
/dashboard/security     -> SecurityPage
/dashboard/subscription -> SubscriptionPage
/dashboard/sharing      -> SharingPage
```

Old routes (`/settings`, `/audits`, `/billing`) will redirect:
- `/settings` -> `/dashboard/profile`
- `/settings?tab=subscription` -> `/dashboard/subscription`
- `/settings?tab=security` -> `/dashboard/security`
- `/settings?tab=sharing` -> `/dashboard/sharing`
- `/settings?tab=integrations` -> `/dashboard/integrations`
- `/audits` -> `/dashboard/analyses`
- `/billing` -> `/dashboard/billing`

## Implementation Order

1. Create `DashboardSidebar.tsx` component
2. Create `DashboardLayout.tsx` layout wrapper
3. Extract each settings tab and page into its own `/dashboard/*` page component
4. Update `App.tsx` routing to use nested dashboard routes
5. Add redirects for old routes
6. Update Header to remove Dashboard link for authenticated users
7. Test all navigation paths and verify visual effects are preserved
