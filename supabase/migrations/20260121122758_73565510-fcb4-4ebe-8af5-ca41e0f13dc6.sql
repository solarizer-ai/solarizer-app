-- Function to handle subscription purchase and grant credits
CREATE OR REPLACE FUNCTION public.purchase_subscription(
  p_plan TEXT,
  p_billing_period TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_credits_to_add INTEGER;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate plan
  IF p_plan NOT IN ('starter', 'pro', 'business') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid plan');
  END IF;
  
  -- Validate billing period
  IF p_billing_period NOT IN ('monthly', 'annual') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid billing period');
  END IF;
  
  -- 50 credits for monthly, 500 for annual Pro/Business
  IF p_billing_period = 'annual' AND p_plan IN ('pro', 'business') THEN
    v_credits_to_add := 500;
  ELSE
    v_credits_to_add := 50;
  END IF;
  
  -- Update subscription
  UPDATE subscriptions
  SET 
    plan = p_plan::subscription_plan,
    status = 'active',
    current_period_start = now(),
    current_period_end = CASE 
      WHEN p_billing_period = 'annual' THEN now() + interval '1 year'
      ELSE now() + interval '1 month'
    END,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  -- Add credits
  UPDATE nloc_credits
  SET 
    credits_remaining = credits_remaining + v_credits_to_add,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING jsonb_build_object(
    'success', true,
    'credits_remaining', credits_remaining,
    'credits_added', v_credits_to_add,
    'plan', p_plan,
    'billing_period', p_billing_period
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credit record not found');
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.purchase_subscription(TEXT, TEXT) TO authenticated;