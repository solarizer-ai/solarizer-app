-- Add Razorpay columns to payment_orders
ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS rz_order_id TEXT,
  ADD COLUMN IF NOT EXISTS rz_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS rz_signature TEXT;

-- Add Razorpay columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS rz_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS rz_plan_id TEXT;

-- Create subscription_events table for Razorpay event logging
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE, -- Razorpay's x-razorpay-event-id for idempotency
  subscription_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  amount_cents INTEGER,
  status TEXT,
  raw_payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_subscription_events_sub_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_payment_id ON subscription_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_id ON subscription_events(event_id);

-- Enable RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_events (system-only writes, user can read their own)
CREATE POLICY "Deny direct insert to subscription_events"
  ON subscription_events FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny direct update to subscription_events"
  ON subscription_events FOR UPDATE
  USING (false);

CREATE POLICY "Deny direct delete from subscription_events"
  ON subscription_events FOR DELETE
  USING (false);

CREATE POLICY "Users can view their own subscription events"
  ON subscription_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.rz_subscription_id = subscription_events.subscription_id
      AND s.user_id = auth.uid()
    )
  );