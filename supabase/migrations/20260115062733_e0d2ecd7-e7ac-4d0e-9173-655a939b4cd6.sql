-- Add coverage_data column for hypothesis testing results
ALTER TABLE public.audits
ADD COLUMN coverage_data JSONB DEFAULT '{}';

-- Add system_hologram column for system analysis data
ALTER TABLE public.audits
ADD COLUMN system_hologram JSONB DEFAULT '{}';