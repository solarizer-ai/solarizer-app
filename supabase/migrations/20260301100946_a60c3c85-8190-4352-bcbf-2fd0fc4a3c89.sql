-- Tighten public audit RLS: restrict to anon role only
DROP POLICY "Anyone can view public audits by slug" ON public.audits;

CREATE POLICY "Anon can view public audits by slug"
  ON public.audits
  FOR SELECT
  TO anon
  USING (is_public = true AND public_slug IS NOT NULL);

-- Tighten public findings RLS: restrict to anon role only
DROP POLICY "Anyone can view findings for public audits" ON public.findings;

CREATE POLICY "Anon can view findings for public audits"
  ON public.findings
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM audits a
      WHERE a.id = findings.audit_id
        AND a.is_public = true
    )
  );