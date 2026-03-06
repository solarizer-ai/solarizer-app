-- Migration 1: Add 'trial' to subscription_plan enum, token_type to access_tokens, trial_activated_at to profiles
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'trial';

ALTER TABLE access_tokens ADD COLUMN IF NOT EXISTS token_type text NOT NULL DEFAULT 'subscription';
-- Add check constraint for token_type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'access_tokens_token_type_check'
  ) THEN
    ALTER TABLE access_tokens ADD CONSTRAINT access_tokens_token_type_check
      CHECK (token_type IN ('subscription', 'trial'));
  END IF;
END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_activated_at timestamptz DEFAULT NULL;