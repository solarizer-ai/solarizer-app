

# Implement Severity-Based Grading Logic & Revert Docs

## Overview

This plan will:
1. **Revert the Docs.tsx changes** back to the original percentage-based descriptions
2. **Implement the actual grading logic** in the `complete-audit` edge function to calculate grades based on finding severities

---

## Part 1: Revert Docs.tsx Security Grades Section

**File: `src/pages/Docs.tsx` (lines 148-165)**

Restore the original grade definitions with percentage ranges:

```typescript
{[
  { grade: 'A', range: '85-100%', desc: 'Excellent security posture' },
  { grade: 'B', range: '70-84%', desc: 'Good with minor issues' },
  { grade: 'C', range: '60-69%', desc: 'Moderate vulnerabilities' },
  { grade: 'D', range: '50-59%', desc: 'Significant concerns' },
  { grade: 'F', range: '0-49%', desc: 'Critical issues found' },
].map((item) => (
  <div key={item.grade} className="text-center p-4 rounded-lg bg-muted/50">
    <div className={`text-2xl font-bold ${...}`}>
      {item.grade}
    </div>
    <div className="text-xs text-muted-foreground mt-1">{item.range}</div>
    <div className="text-xs mt-2">{item.desc}</div>
  </div>
))}
```

---

## Part 2: Implement Grading Logic in complete-audit

**File: `supabase/functions/complete-audit/index.ts`**

The `complete-audit` function currently receives the grade from n8n. We'll modify it to:

1. **Before updating the audit**, query all findings for this audit
2. **Calculate the grade** based on the highest severity finding:
   - If any `critical` finding → Grade **F**
   - Else if any `high` finding → Grade **D**
   - Else if any `medium` finding → Grade **C**
   - Else if any `low` finding → Grade **B**
   - Else (only `info` or no findings) → Grade **A**
3. **Override the incoming grade** with the calculated one

### New Helper Function

```typescript
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

function calculateGradeFromFindings(findingsSeverities: Severity[]): Grade {
  // Priority order: critical > high > medium > low > info
  if (findingsSeverities.includes('critical')) return 'F';
  if (findingsSeverities.includes('high')) return 'D';
  if (findingsSeverities.includes('medium')) return 'C';
  if (findingsSeverities.includes('low')) return 'B';
  return 'A'; // Only info or no findings
}
```

### Modified complete-audit Logic

After validation, before the update:

```typescript
// Query all findings for this audit to calculate grade
const { data: findings, error: findingsError } = await supabase
  .from('findings')
  .select('severity')
  .eq('audit_id', audit_id);

if (findingsError) {
  console.error('complete-audit: Failed to fetch findings:', findingsError);
  return new Response(
    JSON.stringify({ error: 'Failed to calculate grade' }),
    { status: 500, headers: corsHeaders }
  );
}

// Calculate grade from findings (overrides incoming grade)
const severities = findings.map(f => f.severity as Severity);
const calculatedGrade = calculateGradeFromFindings(severities);

console.log(`complete-audit: Calculated grade ${calculatedGrade} from ${findings.length} findings`);

// Use calculated grade instead of incoming grade
const updateData: Record<string, unknown> = {
  security_score,
  grade: calculatedGrade,  // ← Use calculated, not incoming
  status,
  updated_at: new Date().toISOString(),
};
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Docs.tsx` | Revert grading section to original percentage-based descriptions |
| `supabase/functions/complete-audit/index.ts` | Add `calculateGradeFromFindings` function and use it to override incoming grade |

---

## How It Works

After this change:
1. n8n can still send a grade (for backwards compatibility), but it will be **ignored**
2. The `complete-audit` function will **always calculate** the grade from actual findings
3. The grading is deterministic: highest severity finding determines the grade

