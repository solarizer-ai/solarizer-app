-- Add resolved metadata to findings table
ALTER TABLE public.findings 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id);

-- Create finding_comments table
CREATE TABLE public.finding_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create finding_status_history table
CREATE TABLE public.finding_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  old_resolved BOOLEAN,
  new_resolved BOOLEAN NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  comment TEXT
);

-- Create indexes for performance
CREATE INDEX idx_finding_comments_finding_id ON public.finding_comments(finding_id);
CREATE INDEX idx_finding_comments_user_id ON public.finding_comments(user_id);
CREATE INDEX idx_finding_status_history_finding_id ON public.finding_status_history(finding_id);
CREATE INDEX idx_findings_resolved_at ON public.findings(resolved_at) WHERE resolved_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.finding_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finding_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finding_comments
-- Users can view comments on findings they have access to (own audit or shared)
CREATE POLICY "Users can view comments on accessible findings"
ON public.finding_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.findings f
    JOIN public.audits a ON f.audit_id = a.id
    WHERE f.id = finding_comments.finding_id
    AND (
      a.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.audit_shares s
        WHERE s.audit_id = a.id AND s.shared_with_user_id = auth.uid()
      )
    )
  )
);

-- Users can add comments on findings they have access to
CREATE POLICY "Users can add comments on accessible findings"
ON public.finding_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.findings f
    JOIN public.audits a ON f.audit_id = a.id
    WHERE f.id = finding_comments.finding_id
    AND (
      a.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.audit_shares s
        WHERE s.audit_id = a.id AND s.shared_with_user_id = auth.uid()
      )
    )
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.finding_comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.finding_comments
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for finding_status_history
-- Users can view status history on findings they have access to
CREATE POLICY "Users can view status history on accessible findings"
ON public.finding_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.findings f
    JOIN public.audits a ON f.audit_id = a.id
    WHERE f.id = finding_status_history.finding_id
    AND (
      a.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.audit_shares s
        WHERE s.audit_id = a.id AND s.shared_with_user_id = auth.uid()
      )
    )
  )
);

-- Users can add status history entries for findings they have access to
CREATE POLICY "Users can add status history on accessible findings"
ON public.finding_status_history
FOR INSERT
WITH CHECK (
  auth.uid() = changed_by
  AND EXISTS (
    SELECT 1 FROM public.findings f
    JOIN public.audits a ON f.audit_id = a.id
    WHERE f.id = finding_status_history.finding_id
    AND (
      a.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.audit_shares s
        WHERE s.audit_id = a.id AND s.shared_with_user_id = auth.uid()
      )
    )
  )
);

-- Add trigger for updated_at on finding_comments
CREATE TRIGGER update_finding_comments_updated_at
BEFORE UPDATE ON public.finding_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();