CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent_off', 'amount_off_cents')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  applicable_to TEXT[] NOT NULL DEFAULT ARRAY['subscription','power_up'],
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  min_amount_cents INTEGER,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  payment_order_id UUID REFERENCES public.payment_orders(id),
  original_amount_cents INTEGER NOT NULL,
  discounted_amount_cents INTEGER NOT NULL,
  discount_applied_cents INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_coupons" ON public.coupons
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "users_view_active_coupons" ON public.coupons
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "users_view_own_redemptions" ON public.coupon_redemptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_view_all_redemptions" ON public.coupon_redemptions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
