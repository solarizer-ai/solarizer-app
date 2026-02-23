

# Mobile Layout Audit — Changes Needed

## Current State vs. Spec

Our homepage has 5 sections: Hero, Findings, Intelligence Engine (Pipeline), Security Infrastructure, CTA. The mobile spec covers 12 areas. Here's what applies and what needs changing.

---

## Section-by-Section Analysis

### 1. Global Mobile Grid
**Status: Needs updates**

| Property | Spec | Current | Change needed |
|---|---|---|---|
| Horizontal padding | 20px | `px-4` (16px) on hero, `px-6` (24px) on others | Standardize to `px-5` (20px) on mobile |
| Section spacing | 64px between sections | `py-16` (64px top+bottom = 128px total, 64px gap) | Already close -- keep `py-16 md:py-24` |
| Border radius | 14px panels, 12px cards, 12px buttons | Mixed (`rounded-xl` = 12px, `rounded-2xl` = 16px) | Update finding cards to `rounded-[14px]`, feature cards to `rounded-xl` (12px) on mobile |

### 2. Hero Section
**Status: Needs several updates**

| Property | Spec | Current | Change needed |
|---|---|---|---|
| Top padding | 72px | `pt-28` (112px) | Change to `pt-[72px] md:pt-40` |
| Bottom padding | 48px | `pb-8` (32px) | Change to `pb-12 md:pb-14` (~48px) |
| Headline size | 28px | `clamp(1.6rem,5vw,5.5rem)` = 25.6px min | Clamp already handles this reasonably -- no change |
| Headline weight | 600-700 | `font-black` (900) | On mobile this is fine for the brand feel; clamp keeps size small enough |
| Subtext size | 16px | `text-xs` (12px) on mobile | Change to `text-base md:text-lg` (16px mobile) |
| Subtext margin | 16px above | `mt-6` (24px) | Change to `mt-4 md:mt-8` |
| Button stack | Vertical, 52px height, 12px gap | No buttons exist in hero currently | No action (hero has no CTA buttons yet) |
| Trust microtext | 13px, mt-14px | `text-[13px] mt-3` (12px) | Change to `mt-3.5 md:mt-4` |

### 3. Terminal Panel
**Status: Needs updates in TerminalAuditDemo.tsx**

| Property | Spec | Current | Change needed |
|---|---|---|---|
| Height | 260-300px max | `h-[300px]` mobile | Already at upper bound -- acceptable |
| Font size | 12.5px mono | `text-[9px]` mobile | Change to `text-[12.5px] sm:text-[11px] md:text-[13px]` -- wait, 9px is too small. Change mobile to `text-[10.5px]` as a compromise (12.5px won't fit content) |
| Line height | 1.45 | `leading-[1.7]` | Reduce to `leading-[1.5]` on mobile |
| Padding | 16px | `p-3` (12px) | Change to `p-4 md:p-5` (16px mobile) |
| Radius | 12px | `rounded-2xl` (16px) on wrapper | Change to `rounded-xl` (12px) on mobile via responsive class |

### 4. Finding Cards
**Status: Needs updates**

| Property | Spec | Current | Change needed |
|---|---|---|---|
| Card padding | 20px mobile | `p-3` (12px) mobile | Change to `p-5 sm:p-6` |
| Card radius | 14px mobile | `rounded-xl` (12px) | Change to `rounded-[14px]` |
| Card spacing | 16px | `gap-4` (16px) | Already correct |
| Severity label | 12px bold | `text-[11px]` | Change to `text-xs` (12px) |
| Vuln name | 18px semibold | `text-sm` (14px) mobile | Change to `text-lg md:text-base` or `text-[18px]` mobile |
| File reference | 14px, 70% opacity | `text-[11px]` | Change to `text-sm` (14px) on mobile |
| Description | 15px, line-height 1.5 | `text-xs` (12px) | Change to `text-[15px] md:text-sm` |

### 5. Differentiator Section
**Not currently built** -- does not exist in the homepage yet. No changes needed now.

### 6. How It Works Steps
**Not currently built** -- does not exist. No changes needed now.

### 7. Speed Comparison
**Not currently built** -- does not exist. No changes needed now.

### 8. Engine Features Grid (our "Security Infrastructure" section)
**Status: Needs updates**

| Property | Spec | Current | Change needed |
|---|---|---|---|
| Layout | Single column mobile | `grid-cols-1 md:grid-cols-2` | Already correct |
| Card padding | 18px | `p-5` (20px) | Close enough, keep |
| Card radius | 12px | `rounded-2xl` (16px) | Change to `rounded-xl md:rounded-2xl` |
| Card spacing | 14px | `gap-4` (16px) | Close enough, keep |

### 9. CLI Install Section (our CTA section)
**Status: Needs updates**

| Property | Spec | Current | Change needed |
|---|---|---|---|
| Install block font | 16px mono | `text-xs` (12px) mobile | Change to `text-base sm:text-sm` |
| Install block padding | 18px | `px-5 py-4` | Change to `p-[18px] sm:px-6 sm:py-4` |
| Install block radius | 12px | `rounded-xl` (12px) | Already correct |
| Button height | 50px, full width | Link, not button | No action -- current "View documentation" link is fine |

### 10. Final CTA
**Status: Current CTA section covers this**

| Property | Spec | Current | Change needed |
|---|---|---|---|
| Headline | 26px | clamp handles this | Already fine |
| Button height | 54px, mt-20px | No "Scan Your Protocol Now" button | No action for now |

### 11. Mobile Effect Reductions
**Status: No heavy effects currently used** -- the homepage is already minimal. No glow/gradient/shadow reductions needed.

### 12. Terminal Authenticity
**Status: Already compliant** -- no fading, blurring, or cropping applied.

---

## Summary of Changes

### File: `src/pages/Home.tsx`
1. Hero padding: `pt-28 pb-8` to `pt-[72px] pb-12 md:pt-40 md:pb-14`
2. Hero horizontal padding: `px-4 sm:px-6` to `px-5 md:px-6`
3. Subtext: `text-xs md:text-lg` to `text-base md:text-lg`
4. Subtext margin: `mt-6 md:mt-8` to `mt-4 md:mt-8`
5. All section containers: standardize mobile padding to `px-5`
6. FindingCard: update padding to `p-5 sm:p-6`, radius to `rounded-[14px]`, severity to `text-xs`, title to `text-[18px] sm:text-base`, file ref to `text-sm sm:text-[11px]`, description to `text-[15px] sm:text-sm`
7. Security feature cards: radius to `rounded-xl md:rounded-2xl`
8. Install block: font to `text-base sm:text-sm`, padding to `p-[18px] sm:px-6 sm:py-4`

### File: `src/components/TerminalAuditDemo.tsx`
1. Body padding: `p-3 sm:p-4 md:p-5` to `p-4 md:p-5`
2. Font size: `text-[9px] sm:text-[11px]` to `text-[10.5px] sm:text-[11px]`
3. Wrapper radius: `rounded-2xl` to `rounded-xl md:rounded-2xl`

