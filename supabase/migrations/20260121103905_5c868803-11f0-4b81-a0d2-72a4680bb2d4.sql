-- Create table for storing GitHub connections
CREATE TABLE public.github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  github_username TEXT NOT NULL,
  github_access_token TEXT NOT NULL,
  github_avatar_url TEXT,
  scopes TEXT[],
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own GitHub connection
CREATE POLICY "Users can view own GitHub connection"
  ON public.github_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GitHub connection"
  ON public.github_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GitHub connection"
  ON public.github_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own GitHub connection"
  ON public.github_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_github_connections_updated_at
  BEFORE UPDATE ON public.github_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();