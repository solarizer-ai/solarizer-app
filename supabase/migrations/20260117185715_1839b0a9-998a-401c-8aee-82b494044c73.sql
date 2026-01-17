-- Create audit_shares table
CREATE TABLE public.audit_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  shared_with_user_id UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(audit_id, shared_with_user_id)
);

-- Enable RLS
ALTER TABLE public.audit_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_shares
CREATE POLICY "Users can view shares for audits they own or are shared with"
ON public.audit_shares FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "Only audit owners can create shares"
ON public.audit_shares FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only audit owners can delete shares"
ON public.audit_shares FOR DELETE
USING (auth.uid() = owner_id);

-- Add SELECT policy on audits for shared users
CREATE POLICY "Users can view audits shared with them"
ON public.audits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.audit_shares
    WHERE audit_shares.audit_id = audits.id
    AND audit_shares.shared_with_user_id = auth.uid()
  )
);

-- Add SELECT policy on findings for shared users
CREATE POLICY "Users can view findings for shared audits"
ON public.findings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.audit_shares
    WHERE audit_shares.audit_id = findings.audit_id
    AND audit_shares.shared_with_user_id = auth.uid()
  )
);

-- Ensure profiles are searchable by authenticated users
CREATE POLICY "Authenticated users can search profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);