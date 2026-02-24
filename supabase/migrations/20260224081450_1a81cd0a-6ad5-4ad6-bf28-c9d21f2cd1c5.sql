
-- Atomic credit increment for subscription renewals
CREATE OR REPLACE FUNCTION public.add_renewal_credits(
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  UPDATE nloc_credits
  SET credits_remaining = credits_remaining + p_credits,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits_remaining INTO v_new_total;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No credit record for user %', p_user_id;
  END IF;

  RETURN v_new_total;
END;
$$;

-- Unique constraint for idempotent webhook processing
ALTER TABLE subscription_events
  ADD CONSTRAINT subscription_events_event_id_unique UNIQUE (event_id);
