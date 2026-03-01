
-- H5: Admin create coupon RPC
CREATE OR REPLACE FUNCTION public.admin_create_coupon(
  p_code text,
  p_description text DEFAULT NULL,
  p_discount_type text DEFAULT 'percent_off',
  p_discount_value numeric DEFAULT 0,
  p_applicable_to text[] DEFAULT ARRAY['subscription', 'power_up'],
  p_max_uses integer DEFAULT NULL,
  p_min_amount_cents integer DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.coupons (
    code, description, discount_type, discount_value,
    applicable_to, max_uses, min_amount_cents, expires_at, created_by
  ) VALUES (
    UPPER(TRIM(p_code)), p_description, p_discount_type, p_discount_value,
    p_applicable_to, p_max_uses, p_min_amount_cents, p_expires_at, auth.uid()
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- H5: Admin toggle coupon active status
CREATE OR REPLACE FUNCTION public.admin_toggle_coupon(p_coupon_id uuid, p_active boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.coupons SET is_active = p_active, updated_at = now()
  WHERE id = p_coupon_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- H5: Admin delete coupon
CREATE OR REPLACE FUNCTION public.admin_delete_coupon(p_coupon_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  DELETE FROM public.coupons WHERE id = p_coupon_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- H8: Update auto_settle_stale_sessions to use 30-minute threshold
CREATE OR REPLACE FUNCTION public.auto_settle_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, user_id, credits_deducted
    FROM public.audits
    WHERE status = 'analyzing'
      AND credits_deducted > 0
      AND is_locked = false
      AND (
        (last_heartbeat IS NOT NULL
         AND last_heartbeat < now() - interval '30 minutes')
        OR
        (last_heartbeat IS NULL
         AND created_at < now() - interval '30 minutes')
      )
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.cli_refund_credits(
      r.user_id, r.credits_deducted, r.id,
      'Auto-settle: full refund for stale session (30m timeout)'
    );
    UPDATE public.audits
    SET status = 'failed',
        is_locked = true,
        credits_deducted = 0,
        error_message = 'Auto-settled: session stale (no heartbeat for 30 minutes)',
        updated_at = now()
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- H8: Schedule the watchdog to run every 15 minutes via pg_cron
SELECT cron.schedule(
  'settle-stale-audit-sessions',
  '*/15 * * * *',
  $$SELECT public.auto_settle_stale_sessions()$$
);
