

# Move Report Page into Dashboard Sidebar Layout

## Problem
The Report page (`/reports/:auditId`) renders standalone with its own `<Header />` and `<Footer />`, outside the dashboard sidebar. This makes it feel disconnected from the rest of the app.

## Solution
Nest the report route inside the `DashboardLayout` so it shares the sidebar, then strip the standalone `<Header />`, `<Footer />`, and "Back to Dashboard" link from the Report component.

## Changes

### 1. `src/App.tsx` -- Move route inside dashboard layout

Move the `/reports/:auditId` route from standalone to nested under the `/dashboard` route group:

```text
Before:
  <Route path="/reports/:auditId" element={<ProtectedRoute><Report /></ProtectedRoute>} />

After:
  (inside the /dashboard route group)
  <Route path="reports/:auditId" element={<Report />} />
```

The route becomes `/dashboard/reports/:auditId`. Add a legacy redirect from `/reports/:auditId` to `/dashboard/reports/:auditId` so existing links and bookmarks still work.

### 2. `src/pages/Report.tsx` -- Remove standalone layout wrapper

- Remove `<Header />` import and usage
- Remove `<Footer />` import and usage
- Remove the outer `min-h-screen bg-background flex flex-col` wrapper div
- Remove the "Back to Dashboard" button (the sidebar already provides navigation)
- Remove `container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8` padding (DashboardLayout provides its own `px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto`)
- Keep the inner `<div className="space-y-6">` as the root element

### 3. Update internal navigation links

Search for any links pointing to `/reports/` and update them to `/dashboard/reports/`:
- `src/components/AuditCard.tsx` (likely navigates to `/reports/:id`)
- Any other components that link to reports

### Summary

| File | Change |
|---|---|
| `src/App.tsx` | Move report route into dashboard group; add legacy redirect |
| `src/pages/Report.tsx` | Remove Header, Footer, back-link, outer wrapper |
| Navigation references | Update `/reports/` to `/dashboard/reports/` |

