-- Create user profiles table with role-based access
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('scientist', 'policy_maker', 'researcher')),
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create water samples table
CREATE TABLE IF NOT EXISTS public.water_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  sample_name TEXT NOT NULL,
  collection_date DATE NOT NULL,
  collection_time TIME,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  depth_meters DECIMAL(5, 2),
  temperature_celsius DECIMAL(4, 2),
  ph_level DECIMAL(4, 2),
  dissolved_oxygen DECIMAL(6, 3),
  turbidity DECIMAL(6, 3),
  conductivity DECIMAL(8, 3),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create heavy metals analysis table
CREATE TABLE IF NOT EXISTS public.heavy_metals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID REFERENCES public.water_samples(id) ON DELETE CASCADE,
  metal_type TEXT NOT NULL,
  concentration_mg_l DECIMAL(10, 6),
  detection_limit DECIMAL(10, 6),
  analysis_method TEXT,
  analysis_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create HMPI calculations table
CREATE TABLE IF NOT EXISTS public.hmpi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID REFERENCES public.water_samples(id) ON DELETE CASCADE,
  hmpi_value DECIMAL(8, 4),
  contamination_level TEXT CHECK (contamination_level IN ('low', 'moderate', 'high', 'very_high')),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculated_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  sample_id UUID REFERENCES public.water_samples(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('contamination', 'threshold_exceeded', 'data_anomaly')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('summary', 'detailed', 'trend_analysis', 'compliance')),
  content JSONB,
  generated_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heavy_metals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hmpi_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects (accessible by all authenticated users)
CREATE POLICY "Authenticated users can view projects" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators can update their projects" ON public.projects
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for water samples
CREATE POLICY "Authenticated users can view water samples" ON public.water_samples
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create water samples" ON public.water_samples
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Sample creators can update their samples" ON public.water_samples
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for heavy metals
CREATE POLICY "Authenticated users can view heavy metals data" ON public.heavy_metals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert heavy metals data" ON public.heavy_metals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.water_samples 
      WHERE id = sample_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for HMPI calculations
CREATE POLICY "Authenticated users can view HMPI calculations" ON public.hmpi_calculations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create HMPI calculations" ON public.hmpi_calculations
  FOR INSERT WITH CHECK (auth.uid() = calculated_by);

-- RLS Policies for alerts
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create alerts" ON public.alerts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update alerts" ON public.alerts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for reports
CREATE POLICY "Authenticated users can view reports" ON public.reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = generated_by);
