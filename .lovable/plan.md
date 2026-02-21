

# Credit Activity Table Redesign + Professional Date Picker & Pagination

## 1. Credit Activity: Column-Based Table Layout

Replace the current row-card layout with a proper table inspired by the screenshot. Columns:

```text
TIME                  | TYPE        | DESCRIPTION                              | AMOUNT   | BALANCE
2026-02-16 14:57:23   | Refund      | Refund: Audit creation failed...         | +1,060   | 4,957,708
2026-02-16 14:57:22   | Deduction   | CLI Audit: First Project (2 contracts)   | -1,060   | 4,956,648
```

- **TIME**: Formatted as `dd-MM-yyyy HH:mm:ss` (matches screenshot style)
- **TYPE**: Badge-style label with color (green for grant/purchase/refund, red for deduction)
- **DESCRIPTION**: Truncated text
- **AMOUNT**: Colored number (+green / -red)
- **BALANCE**: Balance after transaction

Uses the existing shadcn `Table` component (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`).

Column headers styled as uppercase, small, muted text matching the screenshot.

## 2. Professional Date Range Picker (Both Pages)

Replace plain `<input type="date">` with Popover + Calendar pickers:

```text
[ 01-02-2026  (calendar icon) ]  to  [ 21-02-2026  (calendar icon) ]  [x Clear]
```

- Each date button opens a `Popover` with the shadcn `Calendar`
- Display format: `dd-MM-yyyy`
- Placeholder: "Pick a date" when no date selected
- Calendar gets `pointer-events-auto` class for proper interaction

## 3. Minimal Pagination Bar (Both Pages)

```text
[<] [>]                                          Lines Per Page  [20 v]
```

- Left: icon-only square buttons (ChevronLeft/ChevronRight) for page navigation
- Right: "Lines Per Page" label + Select dropdown (10, 15, 20, 50) on one line
- `pageSize` becomes stateful, default 20 for credits, 15 for billing
- Changing page size resets page to 1

## Technical Details

### Files to modify

| File | Changes |
|------|---------|
| `src/components/settings/CreditActivityLog.tsx` | Replace card-row layout with Table; add Popover+Calendar date pickers; add new pagination bar with Lines Per Page select; add `pageSize` state |
| `src/pages/dashboard/BillingPage.tsx` | Same date picker and pagination changes for the Transaction History section |

### New imports for CreditActivityLog
- `Table, TableHeader, TableRow, TableHead, TableBody, TableCell` from `@/components/ui/table`
- `Popover, PopoverTrigger, PopoverContent` from `@/components/ui/popover`
- `Calendar` from `@/components/ui/calendar`
- `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` from `@/components/ui/select`
- `format` from `date-fns`
- `CalendarIcon` from `lucide-react`

### State changes
- `startDate`/`endDate`: change from `string | null` to `Date | undefined` internally, convert to ISO string for the hook
- New `pageSize` state (default 20 for credits, 15 for billing)

### No hook changes needed
Both `useCreditActivity` and `useBillingHistory` already accept all required parameters.

