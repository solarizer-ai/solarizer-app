ALTER TABLE public.credit_txns DROP CONSTRAINT credit_txns_type_check;

ALTER TABLE public.credit_txns ADD CONSTRAINT credit_txns_type_check
  CHECK (type = ANY (ARRAY['subscription_grant','purchase','deduction','refund','reservation','commit','release','admin_adjustment']));