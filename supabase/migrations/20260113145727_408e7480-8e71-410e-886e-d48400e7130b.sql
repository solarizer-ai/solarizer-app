-- Enable realtime on findings and audits tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.findings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audits;