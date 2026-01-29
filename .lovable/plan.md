

# Mobile Typography Optimization Plan

## Current State Analysis

After reviewing the codebase, here's the current typography situation:

| Element | Current Size | Best Practice | Status |
|---------|-------------|---------------|--------|
| Body (base) | Not explicitly set (browser default ~16px) | 16px-18px | Needs explicit setting |
| H1 (Hero) | `clamp(1.75rem, 5vw, 4.5rem)` = 28px-72px | 32px-40px on mobile | Good fluid scale |
| H2 (Section) | `text-3xl md:text-4xl` = 30px/36px | 24px-30px on mobile | Slightly large |
| H3 (Subheader) | `text-lg` = 18px | 20px-24px | Too small |
| Buttons | `text-sm` = 14px | 14px-16px | Good |
| Labels/Input | `text-sm` = 14px | 14px-16px | Good |
| Captions | `text-xs` = 12px | 12px-14px | Good |
| Dialog Title | `text-lg` = 18px | 20px-24px | Could be larger |
| Card Title | `text-2xl` = 24px | 20px-24px | Good |

**Key Issues:**
1. No explicit base font size or line-height set globally
2. Line-height not optimized for readability (should be 1.4-1.6)
3. Section headers (H2) could be refined for mobile
4. Dialog/Modal titles could be slightly larger for prominence

---

## Implementation Plan

### 1. Global Base Typography (src/index.css)

Add explicit base font sizing and line-height:

```css
@layer base {
  html {
    font-size: 16px; /* Explicit base */
  }
  
  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 1rem; /* 16px base */
    line-height: 1.5; /* Optimal readability */
  }
  
  /* Typography scale for headings */
  h1 {
    line-height: 1.2;
  }
  
  h2, h3 {
    line-height: 1.3;
  }
  
  p {
    line-height: 1.6; /* Best for body text */
  }
}
```

### 2. Custom Typography Utilities (src/index.css)

Add mobile-first typography utilities:

```css
@layer utilities {
  /* Mobile-optimized heading scale */
  .heading-hero {
    @apply text-[2rem] sm:text-[2.5rem] lg:text-[3.5rem];
    line-height: 1.15;
  }
  
  .heading-section {
    @apply text-2xl sm:text-3xl md:text-4xl;
    line-height: 1.25;
  }
  
  .heading-subsection {
    @apply text-xl sm:text-2xl;
    line-height: 1.3;
  }
  
  /* Body text variants */
  .text-body {
    @apply text-base;
    line-height: 1.6;
  }
  
  .text-body-lg {
    @apply text-lg md:text-xl;
    line-height: 1.6;
  }
}
```

### 3. Dialog Component Update (src/components/ui/dialog.tsx)

Update DialogTitle for better mobile readability:

```tsx
// Line 70: Change from text-lg to responsive sizing
className={cn("text-xl font-semibold leading-tight tracking-tight", className)}
```

### 4. Card Component Update (src/components/ui/card.tsx)

Add responsive sizing to CardTitle:

```tsx
// Line 19: Add mobile-responsive sizing
className={cn("text-xl sm:text-2xl font-semibold leading-tight tracking-tight", className)}
```

### 5. Label Component Update (src/components/ui/label.tsx)

Ensure labels meet minimum size on mobile:

```tsx
// Line 7: Ensure minimum 14px on mobile
const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
// No change needed - text-sm (14px) meets best practice
```

### 6. Input Component Verification (src/components/ui/input.tsx)

Current implementation is correct:
- `text-base` (16px) on mobile
- `md:text-sm` (14px) on desktop
- This follows Apple's iOS guidelines (16px minimum prevents zoom on focus)

---

## Files to Modify

| File | Change | Reason |
|------|--------|--------|
| `src/index.css` | Add base typography + utility classes | Global readability foundation |
| `src/components/ui/dialog.tsx` | DialogTitle `text-xl` | Better modal header prominence |
| `src/components/ui/card.tsx` | CardTitle responsive sizing | Mobile-first hierarchy |

---

## Typography Scale Reference

After implementation, the mobile scale will be:

| Element | Mobile Size | Desktop Size | Line Height |
|---------|-------------|--------------|-------------|
| Hero H1 | 32px | 56px | 1.15 |
| Section H2 | 24px | 36px | 1.25 |
| Subsection H3 | 20px | 24px | 1.3 |
| Body | 16px | 16px | 1.6 |
| Body Large | 18px | 20px | 1.6 |
| Buttons | 14px | 14px | 1 |
| Labels | 14px | 14px | 1 |
| Captions | 12px | 12px | 1.4 |

---

## Best Practices Compliance

| Practice | Implementation |
|----------|----------------|
| Never below 12px | All text-xs elements are 12px minimum |
| System Fonts | Inter + system-ui fallback configured |
| Line Height 1.4-1.6 | Added explicit line-height to body (1.6) and headings (1.15-1.3) |
| Line Length 30-50 chars | Already using max-width containers |
| High Contrast | Dark theme uses 98% white on 2% black |

