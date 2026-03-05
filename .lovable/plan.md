

# Remove Score Trend Widget from Dashboard Home

## Changes

**`src/pages/dashboard/DashboardHome.tsx`**:
- Remove the `SecurityTrend` import (line 9)
- Remove the mobile `SecurityTrend` block (lines 175-177: `<div className="lg:hidden"><SecurityTrend /></div>`)
- Remove the desktop `SecurityTrend` block in the sidebar (lines 183-185: `<div className="hidden lg:block"><SecurityTrend /></div>`)

After this, the `SecurityTrend` component file can be deleted since it won't be used anywhere.

