

# Update Solarizer: Remove Code Editor References & Revise Grading System

## Overview

This plan makes four key changes:
1. Remove "Interactive Code Editor" from Pro plan features everywhere
2. Update the Home page CTA section text and remove social proof stats
3. Change button text from "Start AI Analysis" to "Start Solarizer"
4. Update the security grading documentation to reflect severity-based grading

---

## Changes Required

### 1. Remove "Interactive Code Editor" from Features

**File: `src/pages/Pricing.tsx` (line 63)**

Remove the feature line from Pro plan:
```typescript
features: [
  { text: 'Everything in Launch, plus:', included: true, isHeader: true },
  { text: 'GitHub Import', included: true },
  // REMOVE: { text: 'Interactive Code Editor', included: true },
  { text: 'Finding Recommendations (Remediation)', included: true },
  ...
]
```

**File: `src/components/UpgradeConfirmationModal.tsx` (lines 22-30)**

Remove from Pro features list:
```typescript
const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    "GitHub Import",
    // REMOVE: "Interactive Code Editor",
    "Finding Recommendations",
    ...
  ],
```

**File: `src/pages/Docs.tsx` (line 42)**

Update FAQ answer to remove code editor mention:
```typescript
answer: "The Launch Plan is a starter tier designed to help you identify vulnerabilities. To access AI-driven remediation and report exports, you will need to upgrade to the Pro Plan."
```

---

### 2. Update Home Page CTA Section (lines 315-324)

Replace "No credit card required" with "Start Analysing Instantly":
```typescript
<div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
  <div className="flex items-center gap-2">
    <CheckCircle2 className="w-4 h-4 text-primary" />
    Start Analysing Instantly
  </div>
  <div className="flex items-center gap-2">
    <CheckCircle2 className="w-4 h-4 text-primary" />
    100% private
  </div>
</div>
```

---

### 3. Remove Social Proof Stats (lines 147-156)

Remove the "1,200+ Contracts Analysed" and "$50M+ TVL Secured" section entirely:
```typescript
{/* REMOVE this entire block */}
<div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
  <span className="flex items-center gap-1.5">
    <Shield className="w-4 h-4 text-primary" />
    <span className="font-medium text-foreground">1,200+</span> Contracts Analysed
  </span>
  <span className="text-border">•</span>
  <span className="flex items-center gap-1.5">
    <span className="font-medium text-foreground">$50M+</span> TVL Secured
  </span>
</div>
```

---

### 4. Update Button Text (lines 130-135)

Change "Start AI Analysis" to "Start Solarizer":
```typescript
<Button asChild variant="solarGlow" size="lg" className="text-base px-8">
  <Link to="/dashboard">
    Start Solarizer
    <ArrowRight className="w-4 h-4 ml-2" />
  </Link>
</Button>
```

---

### 5. Update Security Grades Documentation (lines 149-155)

Update the grading system to be severity-based:
```typescript
{[
  { grade: 'F', desc: 'At least 1 Critical finding' },
  { grade: 'D', desc: 'At least 1 High finding' },
  { grade: 'C', desc: 'At least 1 Medium finding' },
  { grade: 'B', desc: 'At least 1 Low finding' },
  { grade: 'A', desc: 'Only Info findings (or none)' },
].map((item) => (
  <div key={item.grade} className="text-center p-4 rounded-lg bg-muted/50">
    <div className={`text-2xl font-bold ${
      item.grade === 'A' || item.grade === 'B' ? 'text-success' :
      item.grade === 'C' ? 'text-warning' : 'text-destructive'
    }`}>
      {item.grade}
    </div>
    <div className="text-xs mt-2">{item.desc}</div>
  </div>
))}
```

---

## Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/Pricing.tsx` | Remove "Interactive Code Editor" feature from Pro plan |
| `src/components/UpgradeConfirmationModal.tsx` | Remove "Interactive Code Editor" from Pro features list |
| `src/pages/Docs.tsx` | Update FAQ and revise grading documentation |
| `src/pages/Home.tsx` | Remove social proof stats, update CTA text, change button text |

---

## Note: Backend Grading Logic

The grade calculation happens in an external n8n workflow, not in the Supabase edge functions. The `complete-audit` function receives the grade from n8n. To fully implement the new grading system (F for Critical, D for High, etc.), the n8n workflow would need to be updated separately. This plan covers all frontend/documentation changes to reflect the new grading system.

