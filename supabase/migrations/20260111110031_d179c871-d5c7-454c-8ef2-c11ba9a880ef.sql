-- Create lifetime_stats table to store persistent metrics that don't reset on audit deletion
CREATE TABLE public.lifetime_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_contracts_scanned INTEGER NOT NULL DEFAULT 0,
  total_vulnerabilities_found INTEGER NOT NULL DEFAULT 0,
  total_nloc_analyzed BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.lifetime_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own lifetime stats" 
ON public.lifetime_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lifetime stats" 
ON public.lifetime_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lifetime stats" 
ON public.lifetime_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lifetime_stats_updated_at
BEFORE UPDATE ON public.lifetime_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();