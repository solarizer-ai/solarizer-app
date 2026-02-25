CREATE POLICY "Users can view own audit orchestration"
  ON public.audit_orchestration
  FOR SELECT
  USING (user_id = auth.uid());