
-- Create audit_orchestration table for remote audit orchestration
CREATE TABLE public.audit_orchestration (
  session_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'queued',
  phase TEXT NOT NULL DEFAULT 'queued',
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_payload JSONB NOT NULL,
  findings JSONB DEFAULT '[]'::jsonb,
  report_markdown TEXT,
  findings_count INT DEFAULT 0,
  error TEXT,
  aborted BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user lookups (active audit check)
CREATE INDEX idx_audit_orchestration_user_status
  ON public.audit_orchestration (user_id, status);

-- RLS enabled with no policies (all access via service role edge functions)
ALTER TABLE public.audit_orchestration ENABLE ROW LEVEL SECURITY;

-- Validation trigger for status field (instead of CHECK constraint)
CREATE OR REPLACE FUNCTION public.validate_audit_orchestration_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('queued', 'running', 'completed', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be one of: queued, running, completed, failed, cancelled', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_audit_orchestration_status_trigger
  BEFORE INSERT OR UPDATE ON public.audit_orchestration
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_audit_orchestration_status();
