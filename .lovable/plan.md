

# Fix Header Overlap on Content Pages

## Problem
The floating header is fixed at the top of the viewport (`fixed top-4`, height `h-14` = 56px, plus 16px top offset = ~72px total). Several pages don't have enough top padding on their `<main>` content, causing the heading text to sit behind or overlap with the header.

## Affected Pages

| Page | Current top padding | Overlaps? |
|------|-------------------|-----------|
| **Docs.tsx** | `py-8` (32px) | Yes -- visible in screenshot |
| **PrivacyPolicy.tsx** | `py-12` (48px) | Yes |
| **TermsOfService.tsx** | `py-12` (48px) | Yes |
| **Pricing.tsx** | `py-16` mobile / `py-24` desktop | Borderline on mobile |
| **ComingSoon.tsx** | `py-24` (96px) | No |
| **Home.tsx** | Hero section with large spacing | No |

## Fix
Replace insufficient top padding with `pt-24` (96px) on each affected page's `<main>` element, which provides comfortable clearance below the fixed header. Bottom padding remains unchanged.

### Changes

**src/pages/Docs.tsx** (line 71)
- Change: `className="container mx-auto px-6 py-8"` 
- To: `className="container mx-auto px-6 pt-24 pb-8"`

**src/pages/PrivacyPolicy.tsx** (line 10)
- Change: `className="flex-1 container max-w-4xl mx-auto px-4 py-12"`
- To: `className="flex-1 container max-w-4xl mx-auto px-4 pt-24 pb-12"`

**src/pages/TermsOfService.tsx** (line 10)
- Change: `className="flex-1 container max-w-4xl mx-auto px-4 py-12"`
- To: `className="flex-1 container max-w-4xl mx-auto px-4 pt-24 pb-12"`

**src/pages/Pricing.tsx** (line 243)
- Change: `className="container mx-auto px-4 py-16 md:py-24"`
- To: `className="container mx-auto px-4 pt-24 pb-16 md:pb-24"`

