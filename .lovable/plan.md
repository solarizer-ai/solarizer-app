

# Fix Google OAuth Display Name

## Problem
When users sign in with Google, their full name (e.g., "Eryonix Techlabs") is available in `raw_user_meta_data` as `full_name` and `name`, but the `handle_new_user()` database trigger only checks for `display_name` -- which is only set by email signups. Google users fall back to the email prefix (e.g., "eryonixtechlabs"), which looks wrong.

## Solution
Update the `handle_new_user()` trigger to check multiple metadata fields in priority order:

1. `display_name` (set by email signup)
2. `full_name` (set by Google OAuth)
3. `name` (also set by Google OAuth)
4. Fall back to email prefix

## Technical Details

### Database Migration
Update the `handle_new_user()` function with an expanded COALESCE chain:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;
```

This also saves the Google avatar URL into `avatar_url` while we're at it.

### Fix existing Google users
Run a one-time update to fix the display name for the existing Google user whose name was incorrectly set:

```sql
UPDATE public.profiles p
SET display_name = u.raw_user_meta_data ->> 'full_name'
FROM auth.users u
WHERE p.user_id = u.id
  AND u.raw_user_meta_data ->> 'full_name' IS NOT NULL
  AND (p.display_name = split_part(u.email, '@', 1)
       OR p.display_name IS NULL);
```

### Files modified
- One database migration (no frontend code changes needed)

