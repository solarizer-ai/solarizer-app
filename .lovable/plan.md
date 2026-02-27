

# Public Report Sharing Feature

## Overview
Add a Public/Private toggle to completed audit reports. When set to public, a unique shareable link is generated that anyone can view without authentication. The public view displays a professionally designed, Solarizer-branded read-only report page.

## Database Changes

### 1. Add columns to `audits` table
- `is_public` (boolean, default false) -- whether the report is publicly accessible
- `public_slug` (text, unique, nullable) -- a short random slug for the public URL (e.g., `a3f8x9k2`)

### 2. RLS Policy for public access
- Add a new SELECT policy on `audits`: allow anonymous read when `is_public = true` and the row matches the `public_slug`
- Add a new SELECT policy on `findings`: allow anonymous read when the parent audit `is_public = true`
- Owner-only UPDATE policy already exists; the toggle just updates `is_public` and `public_slug`

### 3. Database function
- `toggle_audit_public(p_audit_id uuid, p_is_public boolean)` -- SECURITY DEFINER RPC that:
  - Verifies the caller owns the audit
  - If setting public: generates a random 10-char slug (if not already set), sets `is_public = true`
  - If setting private: sets `is_public = false` (keeps slug for re-enabling)
  - Returns the slug

## Frontend Changes

### 4. Public/Private Toggle on Report Page (`src/pages/Report.tsx`)
- Add a toggle button (Globe/Lock icon + Switch) in the report header, next to the Share/Export buttons
- Only visible to the audit owner and when audit is completed (not analyzing/failed/cancelled)
- When toggled on: calls the RPC, shows the public link with a copy button
- When toggled off: calls the RPC, hides the link

### 5. New Public Report Page (`src/pages/PublicReport.tsx`)
A standalone, professionally designed page that:
- Fetches audit + findings using the public slug (no auth required)
- Uses Supabase anon key (no user session needed)
- Displays a Solarizer-branded layout with:
  - Solarizer logo + "Security Audit Report" header
  - Project name, date, nLOC count, grade badge
  - Security score card (grade ring + severity breakdown)
  - Scope section (list of contracts analyzed)
  - All findings grouped by severity, each with:
    - Title, severity badge, description
    - Code snippet with syntax highlighting
    - Remediation guidance
    - Resolved/Unresolved status indicator
  - Verification coverage summary (if available)
  - Footer with Solarizer branding + disclaimer
- Fully read-only -- no edit, comment, or share functionality
- Responsive design matching the Obsidian + Solar Orange theme
- No Header/Footer navigation (standalone branded page)

### 6. Route Registration (`src/App.tsx`)
- Add public route: `/report/:slug` pointing to `PublicReport` component (no ProtectedRoute wrapper)

### 7. Custom Hook (`src/hooks/usePublicAudit.ts`)
- `usePublicAudit(slug)` -- fetches audit by `public_slug` where `is_public = true`
- `usePublicFindings(auditId)` -- fetches findings for the public audit
- Both use the anon key (no auth session required)

### 8. Toggle Hook (`src/hooks/useTogglePublicReport.ts`)
- Mutation hook that calls the `toggle_audit_public` RPC
- Invalidates the audit query cache on success

## Public URL Format
`https://solarizer-app.lovable.app/report/<slug>`

Example: `https://solarizer-app.lovable.app/report/a3f8x9k2`

## Security Considerations
- Only the audit owner can toggle public/private
- Public access is read-only (SELECT only via RLS)
- Slugs are random 10-char alphanumeric strings (not guessable)
- No user data is exposed in the public view (no emails, no user IDs)
- The public page does not show remediation toggle or comment features

## Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Add `is_public`, `public_slug` columns + RLS policies + RPC |
| `src/pages/PublicReport.tsx` | **New** -- branded public report page |
| `src/hooks/usePublicAudit.ts` | **New** -- fetch audit/findings by slug |
| `src/hooks/useTogglePublicReport.ts` | **New** -- toggle mutation hook |
| `src/pages/Report.tsx` | Add Public/Private toggle with link copy |
| `src/App.tsx` | Add `/report/:slug` public route |

