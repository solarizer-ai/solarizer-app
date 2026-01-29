-- Add is_locked column to audits table to prevent modifications after completion/failure
ALTER TABLE public.audits 
ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Add partial index for faster lookups on locked audits
CREATE INDEX idx_audits_is_locked ON public.audits(is_locked) WHERE is_locked = true;