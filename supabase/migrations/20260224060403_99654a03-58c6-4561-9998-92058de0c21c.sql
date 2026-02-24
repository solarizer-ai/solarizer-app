CREATE TYPE public.finding_verification_status
  AS ENUM ('unverified', 'verified', 'downgraded', 'false_positive');

ALTER TABLE public.findings
  ADD COLUMN verification_status public.finding_verification_status
  NOT NULL DEFAULT 'unverified';