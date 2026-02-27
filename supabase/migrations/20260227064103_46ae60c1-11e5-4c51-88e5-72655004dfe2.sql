
-- Add public sharing columns to audits
ALTER TABLE public.audits
  ADD COLUMN is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN public_slug text UNIQUE;

-- Index for fast slug lookups
CREATE INDEX idx_audits_public_slug ON public.audits (public_slug) WHERE public_slug IS NOT NULL;

-- RLS: Allow anonymous read of public audits by slug
CREATE POLICY "Anyone can view public audits by slug"
  ON public.audits FOR SELECT
  USING (is_public = true AND public_slug IS NOT NULL);

-- RLS: Allow anonymous read of findings for public audits
CREATE POLICY "Anyone can view findings for public audits"
  ON public.findings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.audits a
    WHERE a.id = findings.audit_id
      AND a.is_public = true
  ));

-- RPC to toggle public/private
CREATE OR REPLACE FUNCTION public.toggle_audit_public(p_audit_id uuid, p_is_public boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_slug TEXT;
  v_existing_slug TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify ownership
  SELECT public_slug INTO v_existing_slug
  FROM audits WHERE id = p_audit_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Audit not found or access denied';
  END IF;

  IF p_is_public THEN
    -- Generate slug if not already set
    IF v_existing_slug IS NULL THEN
      v_slug := substr(md5(random()::text || clock_timestamp()::text), 1, 10);
    ELSE
      v_slug := v_existing_slug;
    END IF;

    UPDATE audits
    SET is_public = true, public_slug = v_slug, updated_at = now()
    WHERE id = p_audit_id;

    RETURN v_slug;
  ELSE
    UPDATE audits
    SET is_public = false, updated_at = now()
    WHERE id = p_audit_id;

    RETURN v_existing_slug;
  END IF;
END;
$$;
