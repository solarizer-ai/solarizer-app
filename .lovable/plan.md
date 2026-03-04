
# Support Tickets Feature

Add a support request system where users can submit tickets from the dashboard sidebar, and admins can view them in the admin user detail page.

---

## Task 1: Database Migration -- `support_tickets` Table

Create `supabase/migrations/..._support_tickets.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_response text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own tickets
CREATE POLICY "users_select_own_tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "admins_manage_tickets" ON public.support_tickets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

---

## Task 2: Support Page for Users

Create `src/pages/dashboard/SupportPage.tsx`:

- Form with subject (text input) and message (textarea) fields
- Submit inserts into `support_tickets` table
- Below the form, list the user's past tickets with status (open/resolved/closed)
- Show admin response inline if one exists
- Uses standard Card/Input/Textarea/Button components

---

## Task 3: Sidebar + Routing

**`src/components/DashboardSidebar.tsx`:**
- Add `{ title: "Support", url: "/dashboard/support", icon: LifeBuoy }` to the ACCOUNT nav group
- Import `LifeBuoy` from lucide-react

**`src/App.tsx`:**
- Import `SupportPage`
- Add route: `<Route path="support" element={<SupportPage />} />`

---

## Task 4: Admin User Detail -- Support Tickets Section

**`src/pages/dashboard/admin/AdminUserDetailPage.tsx`:**
- Add a query to fetch `support_tickets` for the viewed user (filtered by `user_id`)
- Render a "Support Tickets" card at the bottom showing subject, status, message, and created date
- Add ability for admin to respond (text input + button) which updates `admin_response` and sets `status = 'resolved'`
- Admin response uses direct Supabase update (admin has ALL policy)

---

## Technical Notes

- RLS ensures users only see their own tickets; admins see all via the `admins_manage_tickets` policy
- No new edge functions needed -- direct table operations via the Supabase client
- Admin response updates both `admin_response`, `responded_at`, and `status` fields in a single update
- The user's Support page shows the admin response so they can see the resolution
