
-- WEB-3: Per-audit callback authentication
ALTER TABLE public.audits ADD COLUMN callback_token TEXT;

-- WEB-8: Session token hashing
ALTER TABLE public.audits ADD COLUMN session_token_hash TEXT;
