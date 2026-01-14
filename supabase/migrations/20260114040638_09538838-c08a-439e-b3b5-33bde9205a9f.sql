-- Add 'cancelled' and 'failed' to audit_status enum
ALTER TYPE audit_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE audit_status ADD VALUE IF NOT EXISTS 'failed';

-- Create refund_credits database function
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id UUID,
  p_nloc_amount INTEGER,
  p_is_starter BOOLEAN DEFAULT FALSE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Add credits back atomically
  UPDATE nloc_credits
  SET 
    credits_remaining = credits_remaining + p_nloc_amount,
    credits_used_this_period = GREATEST(0, credits_used_this_period - p_nloc_amount),
    scans_remaining = CASE 
      WHEN p_is_starter THEN scans_remaining + 1 
      ELSE scans_remaining 
    END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING jsonb_build_object(
    'success', true,
    'credits_remaining', credits_remaining,
    'credits_refunded', p_nloc_amount
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credit record not found');
  END IF;
  
  RETURN v_result;
END;
$$;