
-- Fix Bug 3: admin_adjust_credits silently fails for users without nloc_credits row
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(p_target_user_id uuid, p_amount integer, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Ensure nloc_credits row exists before updating
  INSERT INTO public.nloc_credits (user_id, credits_remaining)
  VALUES (p_target_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

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
$function$;

-- Fix Bug 6: admin_get_audits returns stale findings_count from audits table
CREATE OR REPLACE FUNCTION public.admin_get_audits(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_status text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_search text DEFAULT NULL::text)
 RETURNS TABLE(audit_id uuid, user_email text, project_name text, audit_status text, grade text, nloc_count integer, credits_deducted numeric, source text, orch_phase text, orch_status text, orch_error text, findings_count integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      (SELECT COUNT(*)::INT FROM public.findings f WHERE f.audit_id = a.id) AS findings_count,
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
$function$;
