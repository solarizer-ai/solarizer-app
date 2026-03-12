

# Show User Email in Coupon Redemptions

## Problem
The redemptions drawer in `AdminCouponsPage.tsx` shows raw `user_id` because the query doesn't join with profiles. The profiles select is attempted but then overridden with `null`.

## Fix
In `src/pages/dashboard/admin/AdminCouponsPage.tsx`, update the redemptions query to join `profiles` via a select join and display `email` instead of `user_id`.

### Changes to `AdminCouponsPage.tsx`:
1. Update the `Redemption` interface: change `profiles` to include `email`
2. Fix the query to use `.select("*, profiles!coupon_redemptions_user_id_fkey(email, display_name)")` — but since there's no FK, use a separate profiles lookup or use two queries
3. Since `coupon_redemptions` has no FK to `profiles`, fetch redemptions then batch-fetch emails from profiles using the user_ids (admin has RLS access to all profiles)
4. Display email (or display_name) instead of user_id in the redemption cards

**Simplest approach**: Since admin can read all profiles, do a second query to fetch profiles for the user_ids in the redemptions, then merge them client-side.

| File | Action |
|------|--------|
| `src/pages/dashboard/admin/AdminCouponsPage.tsx` | Update redemptions query to fetch user emails from profiles |

