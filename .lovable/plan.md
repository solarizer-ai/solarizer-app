

# Add "Plans & Costing" Documentation Page

## Overview
Create a new documentation page at `/docs/plans-and-costing` with 4 tabs covering credits, plan comparison, analysis depth, and worked examples. Add a sidebar link in the docs navigation.

## Changes

### 1. Create `src/pages/docs/PlansAndCostingPage.tsx`

A new page with 4 tabs using the existing `Tabs`/`TabsContent`/`Card` pattern from other docs pages:

**Tab 1 -- How Credits Work** (5 cards):
- The Credit System (Coins icon) -- base rate explanation
- Complexity Multipliers (Layers icon) -- L1/L2/L3 table
- Context Files: 85% Discount (FileStack icon) -- scope vs context
- How Your Audit Cost Is Calculated (Calculator icon) -- formula + worked example table
- Power-Up Credits (Zap icon) -- plan rate comparison table

**Tab 2 -- Plan Comparison** (1 card):
- Full feature comparison matrix with checkmarks/dashes across Spark, Blaze, Inferno

**Tab 3 -- Analysis Depth** (4 cards):
- Your Audit Never Stops (Shield icon) -- plan adaptation explanation + code block
- Scope Limits (AlertTriangle icon) -- per-plan limits table + warning example
- What Runs on Each Plan (ListChecks icon) -- 7-phase breakdown table
- Dashboard Reports (Cloud icon) -- per-plan report access table

**Tab 4 -- Examples** (4 cards):
- Solo developer on Spark -- 280 nLOC ERC-20 walkthrough
- DeFi team on Blaze -- 3-contract + context walkthrough
- Hitting the scope limit -- warning UX explanation
- Resuming after upgrade -- checkpoint behavior

### 2. Update `src/components/DocsSidebar.tsx`

Add a new nav item to the `navItems` array:
```
{ title: "Plans & Costing", url: "/docs/plans-and-costing", icon: Coins }
```

Import `Coins` from lucide-react.

### 3. Update `src/App.tsx`

Add route inside the `/docs` layout:
```
<Route path="plans-and-costing" element={<PlansAndCostingPage />} />
```

Import the new page component.

## Technical Details

- All tables rendered as HTML `table` elements with Tailwind styling matching existing docs pages
- Code blocks use the existing `Code` inline component pattern and `pre`/`code` for multi-line blocks
- Cards use `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent` from the UI library
- Check marks rendered as green checkmarks, dashes as muted text
- No new dependencies required -- all icons from lucide-react
- Page is public (inside DocsLayout, no ProtectedRoute)
