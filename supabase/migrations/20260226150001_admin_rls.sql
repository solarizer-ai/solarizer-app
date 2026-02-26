-- Allow admins to SELECT all rows from these tables (cross-user access)

CREATE POLICY "admins_select_all_audits" ON public.audits
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins_select_all_orchestration" ON public.audit_orchestration
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins_select_all_credit_txns" ON public.credit_txns
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins_select_all_subscriptions" ON public.subscriptions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins_select_all_nloc_credits" ON public.nloc_credits
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins_select_all_payment_orders" ON public.payment_orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins_select_all_profiles" ON public.profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins_select_all_findings" ON public.findings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
