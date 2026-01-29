-- Create billing_profiles table for storing customer billing information
CREATE TABLE public.billing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Contact (required for Cashfree)
  phone VARCHAR(20) NOT NULL,
  
  -- Primary Address (required for invoicing)
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(2) DEFAULT 'US' NOT NULL,
  
  -- Separate Billing Address (optional)
  use_different_billing_address BOOLEAN DEFAULT FALSE,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(2) DEFAULT 'US',
  
  -- Business/Tax Info (optional)
  tax_id VARCHAR(50),
  company_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own billing profile
CREATE POLICY "Users can view their own billing profile"
  ON public.billing_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own billing profile
CREATE POLICY "Users can insert their own billing profile"
  ON public.billing_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own billing profile
CREATE POLICY "Users can update their own billing profile"
  ON public.billing_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Deny delete (billing records should be preserved for audit)
CREATE POLICY "Deny delete from billing_profiles"
  ON public.billing_profiles
  FOR DELETE
  USING (false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_billing_profiles_updated_at
  BEFORE UPDATE ON public.billing_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();