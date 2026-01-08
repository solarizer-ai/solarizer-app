-- Create audit status enum
CREATE TYPE public.audit_status AS ENUM ('pending', 'analyzing', 'secured', 'issues');

-- Create security grade enum
CREATE TYPE public.security_grade AS ENUM ('A', 'B', 'C', 'D', 'F');

-- Create severity enum for findings
CREATE TYPE public.finding_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');

-- Create audits table
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  contract_code TEXT NOT NULL,
  contract_count INTEGER NOT NULL DEFAULT 1,
  status audit_status NOT NULL DEFAULT 'pending',
  grade security_grade,
  security_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create findings table
CREATE TABLE public.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity finding_severity NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  line_start INTEGER,
  line_end INTEGER,
  code_snippet TEXT,
  remediation TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

-- Audits RLS policies (users can only access their own audits)
CREATE POLICY "Users can view their own audits"
ON public.audits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audits"
ON public.audits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audits"
ON public.audits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audits"
ON public.audits FOR DELETE
USING (auth.uid() = user_id);

-- Findings RLS policies (users can access findings for their audits)
CREATE POLICY "Users can view findings for their audits"
ON public.findings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.audits
    WHERE audits.id = findings.audit_id
    AND audits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create findings for their audits"
ON public.findings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.audits
    WHERE audits.id = findings.audit_id
    AND audits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update findings for their audits"
ON public.findings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.audits
    WHERE audits.id = findings.audit_id
    AND audits.user_id = auth.uid()
  )
);

-- Trigger for audit timestamp updates
CREATE TRIGGER update_audits_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_audits_user_id ON public.audits(user_id);
CREATE INDEX idx_audits_created_at ON public.audits(created_at DESC);
CREATE INDEX idx_findings_audit_id ON public.findings(audit_id);
CREATE INDEX idx_findings_severity ON public.findings(severity);