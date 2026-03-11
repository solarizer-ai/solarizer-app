

# Create a Dedicated Trial Activation Page

## What
A new standalone page at `/activate-trial` where logged-in users can enter a trial code and activate their free trial. This replaces the need for the modal-based approach and gives users a direct URL to visit.

## Plan

### 1. Create `src/pages/ActivateTrial.tsx`
A full-page form (not a modal) reusing the same `activate_trial` RPC logic from `TrialActivationModal.tsx`. The page will:
- Show the Solarizer logo, a heading, and a description
- Have a trial code input field (monospace, uppercase) with a KeyRound icon
- Show error/success states inline
- On success, redirect to `/dashboard` after a brief toast
- Use the existing dark theme / HeroBackground for visual consistency with the Auth page

### 2. Add route in `src/App.tsx`
Add a protected route:
```
<Route path="/activate-trial" element={<ProtectedRoute><ActivateTrial /></ProtectedRoute>} />
```
This ensures only logged-in users can access it.

### Changes Summary
| File | Action |
|------|--------|
| `src/pages/ActivateTrial.tsx` | Create — standalone trial activation page |
| `src/App.tsx` | Add `/activate-trial` protected route |

