
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_nloc_amount integer,
  p_is_starter boolean DEFAULT false,
  p_audit_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_current_credits INTEGER;
  v_new_balance INTEGER;
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
  
  v_new_balance := v_current_credits - p_nloc_amount;
  
  UPDATE nloc_credits
  SET 
    credits_remaining = v_new_balance,
    credits_used_this_period = credits_used_this_period + p_nloc_amount,
    updated_at = now()
  WHERE user_id = v_user_id;

  -- Log the transaction
  INSERT INTO public.credit_txns (user_id, type, amount, balance_after, audit_id, description)
  VALUES (v_user_id, 'deduction', -p_nloc_amount, v_new_balance, p_audit_id, 
          COALESCE(p_description, 'Web audit deduction'));

  v_result := jsonb_build_object(
    'success', true,
    'credits_remaining', v_new_balance,
    'credits_used_this_period', (SELECT credits_used_this_period FROM nloc_credits WHERE user_id = v_user_id)
  );
  
  RETURN v_result;
END;
$function$;
