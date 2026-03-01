
-- C1: Create reactivate_subscription RPC
CREATE OR REPLACE FUNCTION public.reactivate_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_sub subscriptions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_sub FROM subscriptions WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No subscription found');
  END IF;

  IF v_sub.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription is not active');
  END IF;

  IF v_sub.current_period_end IS NOT NULL AND v_sub.current_period_end <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription period has expired');
  END IF;

  IF v_sub.cancel_at_period_end = false THEN
    RETURN jsonb_build_object('success', true, 'message', 'Subscription is already active');
  END IF;

  UPDATE subscriptions
  SET cancel_at_period_end = false, updated_at = now()
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- C2: Helper function to check user subscription plan
CREATE OR REPLACE FUNCTION public.user_has_plan(_user_id uuid, _plans text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND plan::text = ANY(_plans)
  )
$$;

-- C2: Restrict QA findings (low/info/gas) to pro/business plans
CREATE POLICY "Restrict QA findings to pro_plus plans"
ON public.findings
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  severity NOT IN ('low', 'info', 'gas')
  OR public.user_has_plan(auth.uid(), ARRAY['pro', 'business'])
  OR public.has_role(auth.uid(), 'admin')
);

-- C2: Restrict audit share creation to business plan
CREATE POLICY "Only business plan can create shares"
ON public.audit_shares
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_has_plan(auth.uid(), ARRAY['business'])
  OR public.has_role(auth.uid(), 'admin')
);

-- C2: Restrict finding comments to pro+ plans (INSERT)
CREATE POLICY "Only pro_plus can add comments"
ON public.finding_comments
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_has_plan(auth.uid(), ARRAY['pro', 'business'])
  OR public.has_role(auth.uid(), 'admin')
);

-- C2: Restrict finding comments to pro+ plans (SELECT)
CREATE POLICY "Only pro_plus can view comments"
ON public.finding_comments
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  public.user_has_plan(auth.uid(), ARRAY['pro', 'business'])
  OR public.has_role(auth.uid(), 'admin')
);

-- C3: Drop insecure purchase_subscription RPC
DROP FUNCTION IF EXISTS public.purchase_subscription(text, text);
