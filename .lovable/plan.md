
# Unified Header and Footer - Professional, Minimal, Clean Design

## Current Issues

| Problem | Details |
|---------|---------|
| Two separate headers | `PublicHeader.tsx` and `Header.tsx` with different layouts and behaviors |
| Two separate footers | `Footer.tsx` (full) and `MinimalFooter.tsx` (minimal) |
| Redundant footer links | "Security Index" and "Exploit Database" just link to /docs |
| Missing footers | Docs page and PaymentSuccess page have no footer |
| Inconsistent navigation | Different nav links shown based on login state |

## Solution

Create a single unified header and footer that adapts based on authentication state while maintaining a consistent, minimal, professional appearance.

---

## 1. Unified Header Design

### Desktop Layout
```text
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo]          Home   Pricing   Docs          [Theme] [Auth Actions]  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Behavior by Auth State
- **Logged Out**: Show "Sign In" and "Get Started" buttons
- **Logged In**: Show "Dashboard" link in nav + user avatar (links to Settings)

### Navigation Links
- Home
- Pricing
- Docs
- Dashboard (only when logged in)

### Changes to `Header.tsx`
- Merge functionality from `PublicHeader.tsx` into `Header.tsx`
- Add auth state detection to show/hide dashboard link and auth buttons
- Center navigation links
- Keep user avatar on right side for logged-in users

---

## 2. Unified Footer Design

### Desktop Layout
```text
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo]   Solarizer                    Privacy  •  Terms  •  Docs       │
│  © 2025 ERYONIX TECHLABS               Powering secure deployments      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```text
┌────────────────────────────────────┐
│  [Logo]  Solarizer                 │
│  Privacy  •  Terms  •  Docs        │
│  © 2025 ERYONIX                    │
└────────────────────────────────────┘
```

### Links to Keep (Essential Only)
- **Privacy** - Legal requirement
- **Terms** - Legal requirement
- **Docs** - User utility

### Links to Remove
- Features (/#features) - Only works from home page
- Pricing - Already in header
- Dashboard (/audits) - Confusing and in header
- Security Index - Redundant (same as Docs)
- Exploit Database - Redundant (same as Docs)

---

## 3. Files to Modify

| File | Action |
|------|--------|
| `src/components/Header.tsx` | Merge PublicHeader logic, add auth-aware navigation |
| `src/components/Footer.tsx` | Simplify to minimal design, remove redundant links |
| `src/components/PublicHeader.tsx` | Delete (merged into Header) |
| `src/components/MinimalFooter.tsx` | Delete (merged into Footer) |

### Pages to Update (use unified components)

| Page | Header | Footer |
|------|--------|--------|
| Home.tsx | Header | Footer |
| Pricing.tsx | Header | Footer |
| Docs.tsx | Header | Footer (add) |
| ComingSoon.tsx | Header | Footer |
| PrivacyPolicy.tsx | Header | Footer |
| TermsOfService.tsx | Header | Footer |
| Index.tsx (Dashboard) | Header | Footer |
| Audits.tsx | Header | Footer |
| Settings.tsx | Header | Footer |
| BillingHistory.tsx | Header | Footer |
| Report.tsx | Header | Footer |
| PaymentSuccess.tsx | Header | Footer (add) |
| SubscriptionSuccess.tsx | Header | Footer |

---

## 4. Technical Details

### Unified Header (`Header.tsx`)

```typescript
const Header = () => {
  const { user, loading } = useAuth();
  
  // Navigation links - Dashboard only shown when logged in
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  // Right side actions based on auth state
  // - Logged out: Sign In + Get Started buttons
  // - Logged in: User avatar (links to /settings)
}
```

### Unified Footer (`Footer.tsx`)

```typescript
const Footer = () => {
  const footerLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Docs", href: "/docs" },
  ];

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-6 py-6">
        {/* Row: Logo + Brand | Links */}
        {/* Row: Copyright | Tagline */}
      </div>
    </footer>
  );
}
```

---

## 5. Visual Design Principles

- **Minimal**: Only essential links and elements
- **Professional**: Clean typography, consistent spacing
- **Clean**: Ample whitespace, no clutter
- **Aesthetic**: Subtle borders, smooth transitions
- **Consistent**: Same appearance on all pages
- **Responsive**: Optimized for mobile and desktop
