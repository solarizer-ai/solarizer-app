

# Mobile Optimisation for Authenticated Pages

## Overview
Systematic mobile UX improvements across all post-login pages: Dashboard, Analyses, Report, Billing, Credit Activity, API Keys, Profile, Security, Sharing, and the new Invariants/Coverage/Insights tabs.

## Issues Identified and Fixes

### 1. Report Page -- Container Padding and Header Overlap
**File:** `src/pages/Report.tsx`

The Report page uses a floating `Header` component (fixed, top-4, z-60) but the main content starts at `py-8` with `px-6` -- no top padding accounts for the floating header on mobile (the header is ~72px tall including offset).

- Change `<main className="container mx-auto px-6 py-8">` to `px-4 sm:px-6 pt-20 sm:pt-24 pb-8` so content clears the floating header on mobile
- The 6-tab `TabsList` with `flex w-full overflow-x-auto` needs scroll snapping and hidden scrollbar styling for smooth mobile swiping

### 2. Report Page -- Tab Bar Mobile Polish
**File:** `src/pages/Report.tsx`

The 6 tabs (Scope, Findings, Archive, Invariants, Coverage, Insights) overflow on mobile without visual affordance.

- Add `no-scrollbar` utility class and `gap-1` between triggers
- Make each `TabsTrigger` use `whitespace-nowrap text-xs sm:text-sm` and reduce icon size to `w-3.5 h-3.5` on mobile
- Hide tab label text on very small screens, show icon-only below 380px using `hidden xs:inline` pattern

### 3. Dashboard Home -- Page Title Font Size
**File:** `src/pages/dashboard/DashboardHome.tsx`

The greeting heading is `text-xl` which is fine but the stat cards grid drops to `grid-cols-1` too early on mobile (they could fit 2-up on 375px+).

- Change `DashboardStats` grid from `grid-cols-1 sm:grid-cols-3` to `grid-cols-2 sm:grid-cols-3` with the third card spanning full width on mobile: wrap the 3rd card in a `col-span-2 sm:col-span-1`

### 4. Dashboard Layout -- Mobile Top Bar
**File:** `src/layouts/DashboardLayout.tsx`

The sticky mobile top bar is `h-12` with only a sidebar trigger -- wastes vertical space and provides no context.

- Reduce height to `h-11`
- Add the Solarizer logo next to the sidebar trigger for brand recognition

### 5. Security Score Card -- Mobile Sizing
**File:** `src/components/SecurityScoreCard.tsx`

- The circular progress is `w-28 h-28` on mobile which is slightly large -- reduce to `w-24 h-24`
- The grade text inside is `text-3xl` -- reduce to `text-2xl` on mobile
- Category pills grid `grid-cols-3` works but the pill text `text-[10px]` for truncated labels is hard to read -- increase to `text-[11px]`

### 6. Credit Activity Log -- Table Horizontal Overflow
**File:** `src/components/settings/CreditActivityLog.tsx`

The 5-column table (Time, Type, Description, Amount, Balance) overflows on mobile with no horizontal scroll container.

- Wrap the `Table` in `<div className="overflow-x-auto">` 
- Hide the "Balance" column on mobile using `hidden sm:table-cell` on both `TableHead` and `TableCell`
- Truncate the Time column to show only date (not full timestamp) on mobile

### 7. Billing Page -- Plan Selector Cards
**File:** `src/components/settings/SubscriptionPlanSelector.tsx`

Each plan row has a fixed `w-32` action button area and `min-w-[80px]` plan name area -- on narrow screens this causes cramping.

- Stack the plan name and action button vertically on mobile: change row layout from `flex items-center justify-between` to `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`
- Make action buttons `w-full sm:w-32`

### 8. Billing Page -- Date Picker Overflow
**File:** `src/pages/dashboard/BillingPage.tsx`

The transaction history date filter row has two `w-[160px]` date buttons side by side, which can overflow on <375px screens.

- Change date buttons to `w-full sm:w-[160px]` and wrap the filter row in `flex flex-col sm:flex-row`

### 9. API Key Manager -- Key Display Overflow
**File:** `src/components/settings/ApiKeyManager.tsx`

API key strings are long and can overflow their containers on mobile.

- Add `break-all` to revealed key text and `max-w-[200px] sm:max-w-none truncate` to the masked key display

### 10. Analyses Page -- Page Title Size
**File:** `src/pages/dashboard/AnalysesPage.tsx`

Page heading is `text-2xl` across all dashboard pages -- slightly large for mobile dashboard context.

- Reduce all dashboard page headings from `text-2xl` to `text-lg sm:text-2xl` across: AnalysesPage, CreditActivityPage, ApiKeysPage, ProfilePage, SecurityPage, SharingPage, BillingPage
- This affects the `<h2>` in each page file

### 11. Finding Item -- Expanded Content Padding
**File:** `src/components/FindingItem.tsx`

The expanded content area uses `p-4` uniformly -- code blocks inside can overflow on mobile.

- Add `overflow-x-auto` to the code block container
- The file path display has `max-w-[200px]` on mobile which is good but the `truncate` can hide important path info -- change to `max-w-[calc(100vw-120px)] sm:max-w-[400px]`

### 12. Global -- Add no-scrollbar utility
**File:** `src/index.css`

Add a reusable utility for hiding scrollbars (needed for tab bars):

```css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

### 13. Findings Filter -- Severity Buttons Wrapping
**File:** `src/components/FindingsFilter.tsx`

The 6 severity filter buttons plus the Filter icon can get cramped on mobile. Currently using `flex-wrap` which is correct, but the truncated labels (`severity.slice(0, 4)`) produce awkward text like "crit", "medi".

- Change mobile abbreviations to 3-letter: `severity.slice(0, 3)` -- producing "cri", "hig", "med", "low", "inf", "gas" -- or better, use single-letter + icon only on mobile

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `src/index.css` | Add no-scrollbar utility |
| `src/layouts/DashboardLayout.tsx` | Mobile top bar height + logo |
| `src/pages/Report.tsx` | Container padding, tab bar styling |
| `src/pages/dashboard/DashboardHome.tsx` | Stats grid 2-col mobile |
| `src/pages/dashboard/AnalysesPage.tsx` | Heading size |
| `src/pages/dashboard/BillingPage.tsx` | Date filter stacking |
| `src/pages/dashboard/CreditActivityPage.tsx` | Heading size |
| `src/pages/dashboard/ApiKeysPage.tsx` | Heading size |
| `src/pages/dashboard/ProfilePage.tsx` | Heading size |
| `src/pages/dashboard/SecurityPage.tsx` | Heading size |
| `src/pages/dashboard/SharingPage.tsx` | Heading size |
| `src/components/SecurityScoreCard.tsx` | Mobile circle + pill sizing |
| `src/components/DashboardStats.tsx` | 2-col grid on mobile |
| `src/components/FindingItem.tsx` | Code overflow, file path width |
| `src/components/FindingsFilter.tsx` | Severity button abbreviations |
| `src/components/settings/CreditActivityLog.tsx` | Table scroll, hide balance col |
| `src/components/settings/SubscriptionPlanSelector.tsx` | Stack plan rows on mobile |
| `src/components/settings/ApiKeyManager.tsx` | Key text overflow |

