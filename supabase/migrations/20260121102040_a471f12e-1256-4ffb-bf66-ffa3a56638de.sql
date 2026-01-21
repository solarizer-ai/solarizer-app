-- Update deduct_credits to remove scan limit logic
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_nloc_amount INTEGER,
  p_is_starter BOOLEAN DEFAULT FALSE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_current_credits INTEGER;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  SELECT credits_remaining INTO v_current_credits
  FROM nloc_credits 
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credit record found');
  END IF;
  
  IF v_current_credits < p_nloc_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'credits_remaining', v_current_credits,
      'required', p_nloc_amount
    );
  END IF;
  
  -- Removed scan limit check - all plans now have unlimited scans
  
  UPDATE nloc_credits
  SET 
    credits_remaining = credits_remaining - p_nloc_amount,
    credits_used_this_period = credits_used_this_period + p_nloc_amount,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING jsonb_build_object(
    'success', true,
    'credits_remaining', credits_remaining,
    'credits_used_this_period', credits_used_this_period
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Update initialize_user_credits to remove scan initialization
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.nloc_credits (user_id, credits_remaining, credits_used_this_period)
  VALUES (NEW.id, 150, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update handle_new_user to remove scan initialization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create starter subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'starter', 'active');
  
  -- Initialize nLOC credits for starter (150 credits, no scan limit)
  INSERT INTO public.nloc_credits (user_id, credits_remaining, credits_used_this_period)
  VALUES (NEW.id, 150, 0);
  
  RETURN NEW;
END;
$$;

-- Update refund_credits to remove scan logic
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id uuid, 
  p_nloc_amount integer, 
  p_is_starter boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Add credits back atomically (removed scan restoration)
  UPDATE nloc_credits
  SET 
    credits_remaining = credits_remaining + p_nloc_amount,
    credits_used_this_period = GREATEST(0, credits_used_this_period - p_nloc_amount),
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