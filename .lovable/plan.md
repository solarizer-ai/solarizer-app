

# Header + Hero Section Update

## 1. Header Changes (`src/components/Header.tsx`)

**Remove spacer block**: Delete the `<div className="h-20" />` spacer at line 175 that creates a visible black block below the floating header.

**Change pill to rounded rectangle**: Update `rounded-full` to `rounded-2xl` on line 65 to match the screenshot style.

## 2. Hero Text Update (`src/pages/Home.tsx`)

**Update heading**: Replace the current hero `<h1>` content:
- Line 1: **"Smart Contract Security"** in white (`text-foreground`)
- Line 2: **"Reimagined With AI"** with the orange-to-yellow gradient (`text-gradient` utility already defined in CSS)

**Update description**: Replace the paragraph below the heading with:
> "Multi-phase AI security analysis for Solidity smart contracts. Find what matters. Ship with confidence."

## 3. Pipeline Section Title Update (`src/pages/Home.tsx`)

**Update section heading**: Change "Five phases. Every contract" to **"Context-Aware Analysis"** in the audit pipeline section.

---

### Technical Details

- **Header shape**: `rounded-full` -> `rounded-2xl` (line 65 of Header.tsx)
- **Spacer removal**: Delete lines 174-175 of Header.tsx
- **Hero h1** (~lines 119-124 of Home.tsx): Swap classes and text content
- **Hero p** (~line 127 of Home.tsx): Update description copy
- **Pipeline h2** (~line 139 of Home.tsx): Update from "Five phases. Every contract" to "Context-Aware Analysis"
- The `text-gradient` class is already defined in `index.css` as `bg-gradient-to-r from-primary via-orange-400 to-amber-400`

