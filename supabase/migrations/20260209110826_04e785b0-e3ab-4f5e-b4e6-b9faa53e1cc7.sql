-- Add column to store Razorpay Payment Link ID
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS rz_payment_link_id TEXT;