ALTER TABLE public.audit_orchestration REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_orchestration;