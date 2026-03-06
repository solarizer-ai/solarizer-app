CREATE OR REPLACE FUNCTION public.admin_create_access_token(
  p_code text,
  p_description text DEFAULT NULL,
  p_max_uses integer DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_token_type text DEFAULT 'subscription'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_token_type NOT IN ('subscription', 'trial') THEN
    RAISE EXCEPTION 'Invalid token type: %', p_token_type;
  END IF;

  INSERT INTO public.access_tokens (code, description, max_uses, expires_at, token_type)
  VALUES (UPPER(TRIM(p_code)), p_description, p_max_uses, p_expires_at, p_token_type);

  RETURN jsonb_build_object('success', true);
END;
$$;