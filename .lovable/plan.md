
# Unified Analysis UX - Widget Removal, Terminology, and Scope Tree Display

## Overview

This plan addresses multiple UX improvements to streamline the analysis experience and provide better real-time feedback on the Scope tab.

---

## 1. Remove the Analyzing Widget Completely

### Current Behavior
When an analysis is submitted, a floating `ScanProgressWidget` appears in the bottom-right corner and persists across navigation.

### Changes Required

| File | Action |
|------|--------|
| `src/components/GlobalScanWidget.tsx` | Delete file |
| `src/App.tsx` | Remove GlobalScanWidget import and usage |
| `src/contexts/ScanContext.tsx` | Keep for realtime subscriptions but remove `showWidget` state (optional cleanup) |

**Note**: The ScanContext will still be used for realtime finding/audit subscriptions - we just won't render the floating widget.

---

## 2. Terminology Consistency: "Analysing" Instead of "Scanning"

### Files to Update

| File | Changes |
|------|---------|
| `src/contexts/ScanContext.tsx` | Toast message: "Security analysis started" → keep (already correct) |
| `src/components/ScanProgressWidget.tsx` | (Will be deleted, no changes needed) |
| `src/pages/Home.tsx` | "Private Scanning Environment" → "Private Analysis Environment" |
| | "Heuristic Scanning" → "Heuristic Analysis" |
| | "Multi-Stage Scanning" → "Multi-Stage Analysis" |
| | "Scanning Depth" → "Analysis Depth" |
| | "standard vulnerability scanning" → "standard vulnerability analysis" |

---

## 3. Report Header Restructure

### Current Layout
```text
Analysis Results    [Live badge]    [Badges/Buttons]
ContractName • Analyzed 5 minutes ago
```

### New Layout
```text
ContractName (large project name)   [Live badge]   [Badges/Buttons]
Analysing...                          ← When status is 'analyzing'
OR
Analysed 5 minutes ago                ← When status is 'secured' or 'issues'
```

### Changes to `src/pages/Report.tsx`

1. Swap the title and project name positions
2. Show "Analysing..." during analysis (status = 'analyzing' or 'pending')
3. Show "Analysed X minutes ago" only after completion

```tsx
// Header area changes
<h2 className="text-xl sm:text-2xl font-semibold text-foreground">
  {currentAudit?.project_name || "Contract"}
</h2>
{isLive ? (
  <p className="text-sm text-muted-foreground animate-pulse">
    Analysing...
  </p>
) : (
  <p className="text-sm text-muted-foreground">
    Analysed {formatTimestamp(currentAudit.created_at)}
  </p>
)}
```

---

## 4. Scope Tab - Real-time File Tree with Status Indicators

### New Requirements

1. **Instantly show all files** sent for audit in a tree structure (from `contract_code` or a new scope storage)
2. **Context files** (not in scope): Grey info icon `(i)`
3. **In-scope files with results**: Green checkmark ✓
4. **In-scope files awaiting results**: Pulsing green dot

### Data Architecture Challenge

Currently, the scope array is only passed to n8n but NOT stored in the database. We need to either:
- **Option A**: Store scope in `system_hologram` JSON column
- **Option B**: Parse `contract_code` (already contains all file content)

**Recommended**: Option A - Store scope metadata when creating the audit

### Database Changes

Update the `run-audit` function to store scope info in the audit record (via `system_hologram`):

```typescript
// In run-audit/index.ts - After creating audit, store scope metadata
await supabase
  .from('audits')
  .update({
    system_hologram: {
      scope: scope,
      all_files: validation.sanitizedFiles.map(f => f.name),
    }
  })
  .eq('id', audit_id);
```

### New ScopeTab Component Design

| File Icon | Meaning |
|-----------|---------|
| Grey `Info` icon | Context file (not in scope) |
| Pulsing green dot | In-scope, awaiting results |
| Green `CheckCircle2` | In-scope, analysis complete |

### Status Determination Logic

```typescript
// Determine file status
const getFileStatus = (filePath: string) => {
  const isInScope = scopeFiles.includes(filePath);
  
  if (!isInScope) {
    return 'context'; // Grey info icon
  }
  
  // Check if we have coverage results for this file
  const hasResults = coverageData?.details?.some(d => 
    d.file === filePath || filePath.includes(d.file)
  );
  
  // Also check if any findings reference this file
  const hasFindings = findings.some(f => 
    f.location && (f.location.includes(filePath) || filePath.includes(f.location))
  );
  
  if (hasResults || hasFindings || auditStatus === 'secured' || auditStatus === 'issues') {
    return 'analysed'; // Green check
  }
  
  return 'pending'; // Pulsing green dot
};
```

### Tree Structure Rendering

Transform flat file paths into nested tree structure:

```typescript
// Convert ["src/A.sol", "src/utils/B.sol", "interfaces/C.sol"]
// Into tree structure for rendering
```

---

## 5. Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Remove GlobalScanWidget |
| `src/components/GlobalScanWidget.tsx` | Delete |
| `src/pages/Report.tsx` | Swap header layout, conditional "Analysing/Analysed" text |
| `src/pages/Home.tsx` | Replace "Scanning" → "Analysis" in 5 places |
| `src/components/ScopeTab.tsx` | Complete rewrite for tree display with status icons |
| `src/hooks/useAudits.ts` | Add `system_hologram` typing for scope data |
| `src/pages/Index.tsx` | Store scope in audit `system_hologram` after creation |
| `supabase/functions/run-audit/index.ts` | Store scope in `system_hologram` before sending to n8n |

---

## 6. Visual Design - Scope Tab

```text
┌─────────────────────────────────────────────────────────────┐
│  📁 Audit Scope                                             │
│  Contracts and files included in this security audit        │
│                                                             │
│  [5 Contracts]  [2,450 Lines of Code]                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FILES IN SCOPE                                             │
│                                                             │
│  📁 src                                                     │
│    ├── ✓ Constants.sol                     (analysed)       │
│    └── ● CoveredMetavault.sol              (analysing)      │
│                                                             │
│  📁 libraries                                               │
│    └── ⓘ PercentageLib.sol                 (context)        │
│                                                             │
│  📁 interfaces                                              │
│    └── ⓘ ICoveredMetavault.sol             (context)        │
└─────────────────────────────────────────────────────────────┘

Legend:
✓ = Green CheckCircle2 (analysed)
● = Pulsing green dot (analysing)
ⓘ = Grey Info icon (context only)
```

---

## Technical Implementation Details

### 1. ScopeTab Props Update

```typescript
interface ScopeTabProps {
  coverageData: CoverageData | null;
  findings: Finding[];
  contractCount: number;
  nlocCount: number | null;
  readOnly?: boolean;
  auditStatus?: 'pending' | 'analyzing' | 'secured' | 'issues';
  systemHologram?: {
    scope?: string[];
    all_files?: string[];
  } | null;
}
```

### 2. Pulsing Green Dot CSS

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
}

.animate-pulse-dot {
  animation: pulse-dot 1.5s ease-in-out infinite;
}
```

### 3. Tree Building Utility

```typescript
interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
  status?: 'context' | 'pending' | 'analysed';
}

function buildFileTree(files: string[]): TreeNode[] {
  // Build hierarchical tree from flat paths
}
```

---

## Summary of Changes

1. **Remove** floating scan widget entirely
2. **Replace** "Scanning" with "Analysing/Analysis" across the app
3. **Restructure** report header: project name first, status below
4. **Show** "Analysing..." during analysis, "Analysed X ago" after completion
5. **Redesign** Scope tab with tree view and real-time status indicators
6. **Store** scope metadata in `system_hologram` for persistence
