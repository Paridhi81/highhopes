-- Insert sample projects (these will be created after users sign up)
-- This script will be run after authentication is set up

-- Sample heavy metal types for reference
INSERT INTO public.heavy_metals (sample_id, metal_type, concentration_mg_l, detection_limit, analysis_method, analysis_date)
SELECT 
  (SELECT id FROM public.water_samples LIMIT 1),
  metal,
  ROUND((RANDOM() * 0.1)::numeric, 6),
  0.001,
  'ICP-MS',
  CURRENT_DATE - INTERVAL '1 day'
FROM (VALUES 
  ('Lead'), ('Mercury'), ('Cadmium'), ('Arsenic'), 
  ('Chromium'), ('Copper'), ('Zinc'), ('Nickel')
) AS metals(metal)
WHERE EXISTS (SELECT 1 FROM public.water_samples);
