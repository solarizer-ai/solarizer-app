
# Docs Page: Sidebar Navigation Layout

## What Changes

### 1. Unified docs route
- Remove `/docs` as a standalone public page with Header/Footer
- Redirect `/docs` to `/docs/setup` 
- Create nested routes: `/docs/setup`, `/docs/audits`, `/docs/grades`, `/docs/reference`, `/docs/faq`
- Dashboard sidebar "Documentation" link changes from `/dashboard/docs` to `/docs/setup`
- Remove `/dashboard/docs` route and `DocsPage.tsx`

### 2. New Docs layout with sidebar (`src/layouts/DocsLayout.tsx`)
- A standalone layout (not inside DashboardLayout) with its own mini sidebar on the left
- Sidebar contains 5 nav items matching the current tabs: Setup, Audits, Grades, Reference, FAQ -- each with its icon
- Includes a "Back to Dashboard" or site header link at top for navigation context
- Uses the same sidebar components (`Sidebar`, `SidebarMenu`, etc.) for visual consistency with the dashboard
- Content area renders an `<Outlet />` for the active section

### 3. Split `DocsContent.tsx` into 5 page components
Create individual page components under `src/pages/docs/`:
- `SetupPage.tsx` -- Installation & Setup card
- `AuditsPage.tsx` -- Running an Audit card
- `GradesPage.tsx` -- Security Grades card
- `ReferencePage.tsx` -- Dashboard Reference card
- `FaqPage.tsx` -- FAQ accordion card

Each is a simple component rendering its respective Card (extracted from the current DocsContent).

### 4. Route updates in `App.tsx`
```
/docs          -> redirect to /docs/setup
/docs/setup    -> DocsLayout > SetupPage
/docs/audits   -> DocsLayout > AuditsPage
/docs/grades   -> DocsLayout > GradesPage
/docs/reference -> DocsLayout > ReferencePage
/docs/faq      -> DocsLayout > FaqPage
/dashboard/docs -> redirect to /docs/setup
```

### 5. Sidebar link update in `DashboardSidebar.tsx`
- Change the Documentation nav link from `/dashboard/docs` to `/docs/setup`

## Technical Details

- **Files to create**: `src/layouts/DocsLayout.tsx`, `src/pages/docs/SetupPage.tsx`, `src/pages/docs/AuditsPage.tsx`, `src/pages/docs/GradesPage.tsx`, `src/pages/docs/ReferencePage.tsx`, `src/pages/docs/FaqPage.tsx`
- **Files to modify**: `src/App.tsx` (route changes), `src/components/DashboardSidebar.tsx` (link update)
- **Files to remove**: `src/pages/dashboard/DocsPage.tsx`, `src/pages/Docs.tsx` (replaced by layout + pages), `src/components/DocsContent.tsx` (split into pages)
- The docs sidebar will include the Solarizer logo at the top and a "Back" link to return to the dashboard or home, maintaining a professional and consistent feel
- No authentication required -- docs remain publicly accessible
- The sidebar uses the same Shadcn sidebar primitives for visual consistency
