

# Disable Public Routes + Redirect All Users to Coming Soon

## Changes

### 1. `src/pages/ComingSoon.tsx` — Full redesign
- Solarizer logo + "Coming Soon" hero
- Feature preview cards: Multi-Pass Vulnerability Hunting, Cross-Contract Analysis, Invariant-Guided Detection, Security Coverage Testing
- Reuse `HeroBackground` for animated background
- CTA: "Sign up for early access" → `/signup`
- No Header/Footer (nav links point to disabled routes)
- Dark theme, solar orange accents

### 2. `src/App.tsx` — Route changes
- `/` → `<ComingSoon />`
- `/pricing`, `/docs/*`, `/privacy`, `/terms`, `/coming-soon` → `<Navigate to="/" />`
- `/login`, `/signup` → Keep (Auth)
- `/dashboard/*` → Redirect to `/` (remove ProtectedRoute wrapper, just redirect)
- `/report/:slug` → Keep (PublicReport, shared links still work)
- `/payment-success`, `/activate-trial` → Redirect to `/`
- Legacy redirects (`/settings`, `/audits`, `/billing`) → Redirect to `/`

### 3. Memory update
- Update navigation policy: all users (logged in or not) see Coming Soon page; dashboard is disabled

| File | Change |
|------|--------|
| `src/pages/ComingSoon.tsx` | Full redesign with features, logo, background |
| `src/App.tsx` | Redirect all routes (including `/dashboard/*`) to Coming Soon |

