

# Add GAS as a first-class severity level

## Overview
Add `gas` to the finding severity enum in the database and update all frontend components to display a distinct green "Gas" badge for gas optimization findings.

## Changes

### 1. Database migration
Add the new enum value to `finding_severity`:
```sql
ALTER TYPE finding_severity ADD VALUE 'gas';
```

### 2. `src/hooks/useAudits.ts` (line 7)
Add `'gas'` to the `FindingSeverity` union type:
```ts
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'gas';
```

### 3. `src/components/FindingItem.tsx`
- Update `Severity` type (line 10) to include `'gas'`
- Import `Fuel` icon from lucide-react (line 2)
- Add `gas` entry to `severityConfig` (after `info`, line 66):
```ts
gas: {
  icon: Fuel,
  label: "Gas",
  className: "text-green-500 bg-green-500/10 border-green-500/20",
},
```

### 4. `src/components/FindingsFilter.tsx`
- Add `'gas'` to `severityOrder` (line 35): `gas: 5`
- Add `'gas'` to `allSeverities` array (line 43)
- Add `gas` case to `getSeverityColor` (line 115):
```ts
case "gas":
  return "bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20";
```

### 5. `src/components/SeverityBreakdown.tsx`
- Import `Fuel` from lucide-react
- Add `gas` row to the severities array (after info):
```ts
{ key: 'gas', label: 'Gas', count: severityBreakdown.gas, color: 'bg-green-500 text-green-500', icon: <Fuel className="w-4 h-4" /> }
```

### 6. `src/hooks/useDashboardStats.ts`
- Add `gas: number` to the `severityBreakdown` interface (line 17)
- Add `gas: 0` to the default empty stats (line 64)
- Add `gas` filter to the breakdown computation (line 87):
```ts
gas: allFindings?.filter(f => f.severity === 'gas').length || 0,
```

## Notes
- The `src/integrations/supabase/types.ts` file will auto-update after the migration runs -- no manual edit needed.
- No backend function changes required.
- The green color scheme distinguishes Gas from Info (slate) and Low (blue).

