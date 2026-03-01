

# First-Time Welcome Greeting

## What You'll See
When any user signs in for the first time (email or OAuth), the dashboard will display a beautiful full-screen overlay with the dashboard blurred behind it. It shows a warm, personalized greeting like "Welcome to Solarizer, [Name]!" with a brief message and a "Get Started" button. One click dismisses it and reveals the dashboard.

Since email signups already provide their display name and OAuth users get their name from Google/Apple, there's no need to ask for a name -- just greet them warmly.

## Implementation Steps

### 1. Database: Add `onboarding_completed` flag to profiles
Add a boolean column `onboarding_completed` (default `false`) to the `profiles` table. This tracks whether the user has seen the welcome screen.

### 2. New Component: `WelcomeGreeting.tsx`
A full-screen overlay component with:
- `backdrop-blur-lg` over the entire dashboard
- Centered card with fade-in + scale animation
- Solarizer logo
- Personalized greeting: "Welcome to Solarizer, [display_name]!"
- A short message about what they can do
- "Get Started" button that sets `onboarding_completed = true` and dismisses with a fade-out animation

### 3. Integrate into `DashboardHome.tsx`
- Query `profiles.onboarding_completed` for the current user
- If `false`, render `WelcomeGreeting` overlay on top of the dashboard (dashboard renders normally behind it, just blurred via CSS)
- On dismiss, update the flag and remove the overlay

## Technical Details

**Migration SQL:**
```sql
ALTER TABLE public.profiles
ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
```

**Files to create:**
- `src/components/WelcomeGreeting.tsx`

**Files to modify:**
- `src/pages/dashboard/DashboardHome.tsx` -- fetch onboarding status, conditionally render overlay

**No RLS changes needed** -- users can already update their own profile via existing policies.
