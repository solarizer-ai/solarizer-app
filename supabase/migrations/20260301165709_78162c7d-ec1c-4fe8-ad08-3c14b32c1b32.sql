
-- ============================================================
-- Access Tokens: invite-code gating for first-time subscriptions
-- ============================================================

-- 1. access_tokens table
CREATE TABLE IF NOT EXISTS public.access_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  description text,
  max_uses    integer,
  used_count  integer NOT NULL DEFAULT 0,
  expires_at  timestamptz,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_access_tokens"
  ON public.access_tokens FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. access_token_redemptions table
CREATE TABLE IF NOT EXISTS public.access_token_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id    uuid NOT NULL REFERENCES public.access_tokens(id),
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (token_id, user_id)
);

ALTER TABLE public.access_token_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_select_access_token_redemptions"
  ON public.access_token_redemptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. validate_access_token RPC
CREATE OR REPLACE FUNCTION public.validate_access_token(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token RECORD;
BEGIN
  SELECT * INTO v_token
  FROM public.access_tokens
  WHERE code = UPPER(TRIM(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid access token');
  END IF;

  IF NOT v_token.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This access token has been deactivated');
  END IF;

  IF v_token.expires_at IS NOT NULL AND v_token.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This access token has expired');
  END IF;

  IF v_token.max_uses IS NOT NULL AND v_token.used_count >= v_token.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This access token has been fully redeemed');
  END IF;

  RETURN jsonb_build_object('valid', true, 'token_id', v_token.id);
END;
$$;

-- 4. redeem_access_token RPC
CREATE OR REPLACE FUNCTION public.redeem_access_token(p_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token RECORD;
  v_already_redeemed boolean;
BEGIN
  SELECT * INTO v_token
  FROM public.access_tokens
  WHERE code = UPPER(TRIM(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid access token');
  END IF;

  IF NOT v_token.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token deactivated');
  END IF;

  IF v_token.expires_at IS NOT NULL AND v_token.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token expired');
  END IF;

  IF v_token.max_uses IS NOT NULL AND v_token.used_count >= v_token.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token fully redeemed');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.access_token_redemptions
    WHERE token_id = v_token.id AND user_id = p_user_id
  ) INTO v_already_redeemed;

  IF v_already_redeemed THEN
    RETURN jsonb_build_object('success', true);
  END IF;

  INSERT INTO public.access_token_redemptions (token_id, user_id)
  VALUES (v_token.id, p_user_id);

  UPDATE public.access_tokens
  SET used_count = used_count + 1
  WHERE id = v_token.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. Admin RPCs
CREATE OR REPLACE FUNCTION public.admin_create_access_token(
  p_code text,
  p_description text DEFAULT NULL,
  p_max_uses integer DEFAULT NULL,
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

  INSERT INTO public.access_tokens (code, description, max_uses, expires_at)
  VALUES (UPPER(TRIM(p_code)), p_description, p_max_uses, p_expires_at);

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_access_token(
  p_token_id uuid,
  p_active boolean
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

  UPDATE public.access_tokens SET is_active = p_active WHERE id = p_token_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_access_token(p_token_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT used_count INTO v_used_count
  FROM public.access_tokens WHERE id = p_token_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token not found');
  END IF;

  IF v_used_count > 0 THEN
    UPDATE public.access_tokens SET is_active = false WHERE id = p_token_id;
    RETURN jsonb_build_object('success', true, 'deactivated', true);
  END IF;

  DELETE FROM public.access_tokens WHERE id = p_token_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
