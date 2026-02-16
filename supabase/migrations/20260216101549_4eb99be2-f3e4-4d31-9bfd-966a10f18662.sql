
-- Phase 1: CLI Schema Extensions Migration

-- 1. api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keys"
  ON public.api_keys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can revoke own keys"
  ON public.api_keys FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix
  ON public.api_keys (key_prefix)
  WHERE revoked_at IS NULL;

-- 2. credit_txns table
CREATE TABLE IF NOT EXISTS public.credit_txns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('subscription_grant', 'purchase', 'deduction', 'refund')),
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2),
  audit_id UUID REFERENCES public.audits(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.credit_txns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own txns"
  ON public.credit_txns FOR SELECT
  USING (user_id = auth.uid());

-- 3. New columns on audits
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web' CHECK (source IN ('web', 'cli'));
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS session_token TEXT UNIQUE;
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS complexity INTEGER CHECK (complexity IN (1, 2, 3));
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS credits_deducted NUMERIC(12,2);
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS tier_discount NUMERIC(4,2) DEFAULT 0.00;
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS scope_metadata JSONB;
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS context_metadata JSONB;
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS contracts_completed INTEGER DEFAULT 0;
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS contracts_total INTEGER DEFAULT 0;
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS current_contract TEXT;
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 4. cli_deduct_credits RPC
CREATE OR REPLACE FUNCTION public.cli_deduct_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_audit_id UUID,
  p_description TEXT
) RETURNS JSON AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT credits_remaining INTO v_current_balance
  FROM public.nloc_credits WHERE user_id = p_user_id FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No credit record found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'balance', v_current_balance,
      'required', p_amount
    );
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.nloc_credits
  SET credits_remaining = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_txns (user_id, type, amount, balance_after, audit_id, description)
  VALUES (p_user_id, 'deduction', -p_amount, v_new_balance, p_audit_id, p_description);

  RETURN json_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. cli_refund_credits RPC
CREATE OR REPLACE FUNCTION public.cli_refund_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_audit_id UUID,
  p_description TEXT
) RETURNS JSON AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  UPDATE public.nloc_credits
  SET credits_remaining = credits_remaining + p_amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits_remaining INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No credit record found');
  END IF;

  INSERT INTO public.credit_txns (user_id, type, amount, balance_after, audit_id, description)
  VALUES (p_user_id, 'refund', p_amount, v_new_balance, p_audit_id, p_description);

  RETURN json_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
