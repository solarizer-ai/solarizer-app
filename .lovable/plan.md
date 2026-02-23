

# Pricing Page Redesign: Netflix-Inspired Minimal Layout

Adapt the Netflix-style plan comparison layout for Solarizer's dark theme. The key design shift: replace the current checkmark/feature list with clean **label-value rows separated by dividers**, and add **gradient header banners** per plan.

## Design Changes

**Current layout:** Cards with checkmark/X feature lists, badge labels, and per-card CTA buttons.

**New layout (Netflix-inspired):**
- Each card gets a **gradient header banner** with plan name and a short tagline (e.g., "Spark / Essentials")
- Features become **label + bold value rows** separated by subtle horizontal dividers (e.g., "Scan depth" / "Single-pass", "nLOC limit" / "500")
- Per-card CTA buttons remain (unlike Netflix's single bottom button) since Solarizer needs per-plan subscribe/upgrade actions
- "Most Popular" badge stays on Blaze card
- Clean, airy spacing with more padding

**Gradient banners per plan (dark theme adapted):**
- Spark: subtle warm gray gradient
- Blaze: orange-to-amber gradient (brand primary)
- Inferno: deep orange-to-red gradient

## Data Restructuring

Replace the `features: PricingFeature[]` array with a `specs` array of `{ label: string; value: string }` pairs:

**Spark:**
| Label | Value |
|-------|-------|
| Scan depth | Single-pass |
| Complexity levels | L1, L2, L3 |
| Severity coverage | Critical, High, Medium |
| nLOC limit | 500 |
| Reports | Local markdown |
| Dashboard reports | 5 credits each |
| Power-up rate | $2.80/credit |

**Blaze:**
| Label | Value |
|-------|-------|
| Scan depth | Deep scan (two-pass) |
| Complexity levels | L1, L2, L3 |
| Severity coverage | All (+ Low, Info, Gas) |
| nLOC limit | 3,000 |
| Cross-contract | Included |
| AI validation | Included |
| Remediation guidance | Included |
| Dashboard reports | Free |
| Power-up rate | $2.50/credit |

**Inferno:**
| Label | Value |
|-------|-------|
| Scan depth | Deep scan (two-pass) |
| Complexity levels | L1, L2, L3 |
| Severity coverage | All (+ Low, Info, Gas) |
| nLOC limit | 12,000 |
| Report sharing | Up to 5 collaborators |
| Remediation tracking | Included |
| Dashboard reports | Free |
| Power-up rate | $2.20/credit |

## File Changes

**Only `src/pages/Pricing.tsx` is modified.** All business logic (getButtonConfig, modals, hooks) stays identical.

### Layout structure per card:

```
+----------------------------------+
|  [Gradient Banner]               |
|  Plan Name                       |
|  Tagline                         |
|           [Most Popular badge]   |
+----------------------------------+
|                                  |
|  Monthly price                   |
|  $199                            |
|  --------------------------------|
|  Credits included                |
|  50                              |
|  --------------------------------|
|  Scan depth                      |
|  Deep scan (two-pass)            |
|  --------------------------------|
|  nLOC limit                      |
|  3,000                           |
|  --------------------------------|
|  ...more rows...                 |
|                                  |
|  [  Subscribe / Upgrade  ]       |
+----------------------------------+
```

### Specific changes:
1. Replace `PricingFeature` interface with `PricingSpec` (`{ label: string; value: string }`)
2. Replace `features` array in each plan with `specs` array
3. Replace the feature list render (checkmarks/X) with label-value rows separated by `border-b border-border` dividers
4. Add gradient banner div at top of each card with plan-specific gradient classes
5. Move price into the first spec row ("Monthly price" / "$199") for consistency with the Netflix pattern
6. Keep the Power Up section and both modals unchanged

### Gradient classes:
- Spark: `bg-gradient-to-br from-zinc-700 to-zinc-800`
- Blaze: `bg-gradient-to-br from-orange-600 to-amber-500`
- Inferno: `bg-gradient-to-br from-orange-700 via-red-600 to-purple-700`

All existing business logic, modals, and the Power Up section remain untouched.

