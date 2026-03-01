
# Inline Password Change on Security Page

Replace the email-based "Reset Password" flow with an inline form that lets users change their password directly by entering their current password and a new password.

## How It Works

1. A "Change Password" button expands a form inline within the Security card
2. The form has three fields: **Current Password**, **New Password**, **Confirm New Password**
3. On submit, the app re-authenticates the user with their current password (via `signInWithPassword`), then calls `updateUser({ password })` to set the new password
4. On success, the form collapses and shows a success message
5. Validation: new password must be at least 8 characters and both entries must match

## Technical Details

**File changed:** `src/pages/dashboard/SecurityPage.tsx`

- Remove the email-based `resetPasswordForEmail` logic
- Add state for `showForm`, `currentPassword`, `newPassword`, `confirmPassword`, `saving`
- On submit:
  1. Call `supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })` to verify the current password
  2. If successful, call `supabase.auth.updateUser({ password: newPassword })`
  3. Show success toast and collapse the form
  4. If current password is wrong, show an error toast
- Password validation: min 8 chars, new password and confirm must match
- UI: Uses existing `Input`, `Button`, `Card` components with the same styling as the rest of the page
