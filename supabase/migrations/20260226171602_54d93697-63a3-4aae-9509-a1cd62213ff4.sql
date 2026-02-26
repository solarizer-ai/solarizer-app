
-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 1: Coupons Tables
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent_off', 'amount_off_cents')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  applicable_to TEXT[] NOT NULL DEFAULT ARRAY['subscription','power_up'],
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  min_amount_cents INTEGER,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  payment_order_id UUID REFERENCES public.payment_orders(id),
  original_amount_cents INTEGER NOT NULL,
  discounted_amount_cents INTEGER NOT NULL,
  discount_applied_cents INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Use has_role() to avoid recursive RLS
CREATE POLICY "admins_manage_coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users_view_active_coupons" ON public.coupons
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "users_view_own_redemptions" ON public.coupon_redemptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_view_all_redemptions" ON public.coupon_redemptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 2: Admin RLS Policies (using has_role)
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "admins_select_all_audits" ON public.audits
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_select_all_orchestration" ON public.audit_orchestration
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_select_all_credit_txns" ON public.credit_txns
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_select_all_subscriptions" ON public.subscriptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_select_all_nloc_credits" ON public.nloc_credits
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_select_all_payment_orders" ON public.payment_orders
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_select_all_profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_select_all_findings" ON public.findings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION 3: Admin RPCs (with search_path + column fixes)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_get_users(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
) RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  plan TEXT,
  subscription_status TEXT,
  credits_remaining INT,
  audits_count BIGINT,
  total_credits_spent NUMERIC,
  created_at TIMESTAMPTZ,
  last_audit_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
    SELECT
      u.id,
      u.email::TEXT,
      p.display_name,
      s.plan::TEXT,
      s.status::TEXT,
      COALESCE(nc.credits_remaining, 0)::INT,
      COUNT(DISTINCT a.id),
      COALESCE(SUM(a.credits_deducted), 0),
      u.created_at,
      MAX(a.created_at)
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    LEFT JOIN public.subscriptions s ON s.user_id = u.id
    LEFT JOIN public.nloc_credits nc ON nc.user_id = u.id
    LEFT JOIN public.audits a ON a.user_id = u.id
    WHERE (
      p_search IS NULL
      OR u.email ILIKE '%' || p_search || '%'
      OR p.display_name ILIKE '%' || p_search || '%'
    )
    GROUP BY u.id, u.email, p.display_name, s.plan, s.status, nc.credits_remaining, u.created_at
    ORDER BY u.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_audits(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL
) RETURNS TABLE (
  audit_id UUID,
  user_email TEXT,
  project_name TEXT,
  audit_status TEXT,
  grade TEXT,
  nloc_count INT,
  credits_deducted NUMERIC,
  source TEXT,
  orch_phase TEXT,
  orch_status TEXT,
  orch_error TEXT,
  findings_count INT,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
    SELECT
      a.id AS audit_id,
      u.email::TEXT AS user_email,
      a.project_name,
      a.status::TEXT AS audit_status,
      a.grade::TEXT,
      a.nloc_count,
      a.credits_deducted,
      a.source,
      ao.phase AS orch_phase,
      ao.status AS orch_status,
      ao.error AS orch_error,
      a.findings_count,
      a.created_at
    FROM public.audits a
    JOIN auth.users u ON u.id = a.user_id
    LEFT JOIN public.audit_orchestration ao ON ao.session_id = a.id::TEXT
    WHERE (p_status IS NULL OR a.status::TEXT = p_status)
      AND (p_user_id IS NULL OR a.user_id = p_user_id)
      AND (p_search IS NULL OR a.project_name ILIKE '%' || p_search || '%'
                            OR u.email ILIKE '%' || p_search || '%')
    ORDER BY a.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'total_users',         (SELECT COUNT(*) FROM auth.users),
    'users_by_plan',       (SELECT json_object_agg(plan, cnt) FROM (
                              SELECT COALESCE(s.plan::TEXT, 'none') AS plan, COUNT(*) AS cnt
                              FROM auth.users u
                              LEFT JOIN public.subscriptions s ON s.user_id = u.id
                              GROUP BY plan
                            ) t),
    'total_audits',        (SELECT COUNT(*) FROM public.audits),
    'audits_today',        (SELECT COUNT(*) FROM public.audits
                              WHERE created_at >= now() - INTERVAL '24 hours'),
    'audits_this_week',    (SELECT COUNT(*) FROM public.audits
                              WHERE created_at >= now() - INTERVAL '7 days'),
    'audits_by_status',    (SELECT json_object_agg(status, cnt) FROM (
                              SELECT status::TEXT, COUNT(*) AS cnt
                              FROM public.audits GROUP BY status
                            ) t),
    'total_credits_spent', (SELECT COALESCE(SUM(credits_deducted), 0)
                              FROM public.audits
                              WHERE status IN ('secured','issues')),
    'total_revenue_cents', (SELECT COALESCE(SUM(amount_cents), 0)
                              FROM public.payment_orders WHERE status = 'paid'),
    'active_audits',       (SELECT COUNT(*) FROM public.audits WHERE status = 'analyzing')
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  p_target_user_id UUID,
  p_amount INT,
  p_reason TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.nloc_credits
    SET credits_remaining = GREATEST(0, credits_remaining + p_amount),
        updated_at = now()
    WHERE user_id = p_target_user_id;

  INSERT INTO public.credit_txns (user_id, type, amount, balance_after, description)
    SELECT
      p_target_user_id,
      'admin_adjustment',
      p_amount,
      credits_remaining,
      'Admin: ' || p_reason
    FROM public.nloc_credits
    WHERE user_id = p_target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_order_type TEXT,
  p_amount_cents INTEGER
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_discount INT;
BEGIN
  SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = UPPER(p_code)
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR used_count < max_uses)
      AND p_order_type = ANY(applicable_to);

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid or expired coupon');
  END IF;

  IF v_coupon.min_amount_cents IS NOT NULL AND p_amount_cents < v_coupon.min_amount_cents THEN
    RETURN json_build_object(
      'valid', false,
      'error', format('Minimum order $%s required', (v_coupon.min_amount_cents / 100.0)::TEXT)
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.coupon_redemptions
    WHERE coupon_id = v_coupon.id AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object('valid', false, 'error', 'Already used by your account');
  END IF;

  IF v_coupon.discount_type = 'percent_off' THEN
    v_discount := FLOOR(p_amount_cents * v_coupon.discount_value / 100);
  ELSE
    v_discount := LEAST(v_coupon.discount_value::INT, p_amount_cents);
  END IF;

  RETURN json_build_object(
    'valid',                  true,
    'coupon_id',              v_coupon.id,
    'code',                   v_coupon.code,
    'description',            COALESCE(v_coupon.description, ''),
    'discount_type',          v_coupon.discount_type,
    'discount_value',         v_coupon.discount_value,
    'discount_applied_cents', v_discount,
    'final_amount_cents',     GREATEST(0, p_amount_cents - v_discount)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_coupon_used_count(p_coupon_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
END;
$$;
