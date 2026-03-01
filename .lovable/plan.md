

# Fix: Add Supabase host to OAuth URL allowlist

## Problem
The OAuth URL returned by Supabase points to `xylfnqrtzqfduutdcxvu.supabase.co` (which then redirects to Google), but the validation only allows `accounts.google.com`. This triggers the "Invalid OAuth redirect URL" error from our own security check.

## Fix
In `src/pages/Auth.tsx`, update the hostname allowlists in both `handleGoogleSignIn` and `handleAppleSignIn` to include the Supabase project hostname.

### handleGoogleSignIn (line ~76)
Change:
```typescript
if (!["accounts.google.com"].some((h) => oauthUrl.hostname === h)) {
```
To:
```typescript
if (!["accounts.google.com", "xylfnqrtzqfduutdcxvu.supabase.co"].some((h) => oauthUrl.hostname === h)) {
```

### handleAppleSignIn (line ~117)
Change:
```typescript
if (!["appleid.apple.com"].some((h) => oauthUrl.hostname === h)) {
```
To:
```typescript
if (!["appleid.apple.com", "xylfnqrtzqfduutdcxvu.supabase.co"].some((h) => oauthUrl.hostname === h)) {
```

## Files Modified
- `src/pages/Auth.tsx` -- add Supabase project host to OAuth URL allowlists

