-- Create a SECURITY DEFINER function to safely deduct credits server-side
-- This prevents client-side manipulation of credit calculations

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_nloc_amount INTEGER,
  p_is_starter BOOLEAN DEFAULT FALSE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_credits INTEGER;
  v_current_scans INTEGER;
  v_result jsonb;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get current credits with row lock to prevent race conditions
  SELECT credits_remaining, scans_remaining 
  INTO v_current_credits, v_current_scans
  FROM nloc_credits 
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credit record found');
  END IF;
  
  -- Check if user has enough credits
  IF v_current_credits < p_nloc_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'credits_remaining', v_current_credits,
      'required', p_nloc_amount
    );
  END IF;
  
  -- For starter users, also check scan limit
  IF p_is_starter AND v_current_scans < 1 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'No scans remaining',
      'scans_remaining', v_current_scans
    );
  END IF;
  
  -- Perform atomic update
  UPDATE nloc_credits
  SET 
    credits_remaining = credits_remaining - p_nloc_amount,
    credits_used_this_period = credits_used_this_period + p_nloc_amount,
    scans_remaining = CASE 
      WHEN p_is_starter THEN GREATEST(0, scans_remaining - 1) 
      ELSE scans_remaining 
    END,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING jsonb_build_object(
    'success', true,
    'credits_remaining', credits_remaining,
    'credits_used_this_period', credits_used_this_period,
    'scans_remaining', scans_remaining
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create a SECURITY DEFINER function to safely add credits from power-up purchases
CREATE OR REPLACE FUNCTION public.purchase_power_up(
  p_nloc_amount INTEGER,
  p_price_cents INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result jsonb;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate inputs
  IF p_nloc_amount <= 0 OR p_price_cents <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;
  
  -- Record the purchase
  INSERT INTO power_up_purchases (user_id, nloc_amount, price_cents)
  VALUES (v_user_id, p_nloc_amount, p_price_cents);
  
  -- Add credits atomically
  UPDATE nloc_credits
  SET 
    credits_remaining = credits_remaining + p_nloc_amount,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING jsonb_build_object(
    'success', true,
    'credits_remaining', credits_remaining,
    'nloc_added', p_nloc_amount
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credit record not found');
  END IF;
  
  RETURN v_result;
END;
$$;

-- Remove the dangerous user UPDATE policy on nloc_credits
-- Users should not be able to directly modify their credits
DROP POLICY IF EXISTS "Users can update their own credits" ON public.nloc_credits;

-- Remove the user INSERT policy on power_up_purchases (now handled by function)
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.power_up_purchases;

-- Add CHECK constraint to ensure credits can't go negative
ALTER TABLE public.nloc_credits 
ADD CONSTRAINT credits_remaining_non_negative 
CHECK (credits_remaining >= 0);

ALTER TABLE public.nloc_credits 
ADD CONSTRAINT scans_remaining_non_negative 
CHECK (scans_remaining >= 0);