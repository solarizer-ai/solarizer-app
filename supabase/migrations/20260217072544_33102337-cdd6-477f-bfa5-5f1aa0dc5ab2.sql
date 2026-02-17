CREATE OR REPLACE FUNCTION public.increment_chat_tokens(
  p_session_id UUID,
  p_tokens INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_tokens_used INTEGER;
BEGIN
  UPDATE public.chat_sessions
  SET tokens_used = tokens_used + p_tokens, updated_at = now()
  WHERE id = p_session_id
  RETURNING tokens_used INTO v_new_tokens_used;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chat session not found: %', p_session_id;
  END IF;

  RETURN v_new_tokens_used;
END;
$$;