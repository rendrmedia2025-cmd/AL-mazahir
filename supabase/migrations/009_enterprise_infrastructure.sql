-- Enterprise Infrastructure Enhancement Migration
-- Adds enterprise-grade tables and functions for the dynamic platform
-- Requirements: 11.1, 11.2, 11.5, 12.3, 14.1

-- Create enterprise-specific types
CREATE TYPE operational_status_enum AS ENUM ('optimal', 'good', 'limited', 'critical');
CREATE TYPE trend_enum AS ENUM ('improving', 'stable', 'declining');
CREATE TYPE trust_indicator_enum AS ENUM (
  'performance_metric',
  'certification', 
  'testimonial',
  'case_study',
  'award',
  'compliance'
);
CREATE TYPE verification_enum AS ENUM ('verified', 'pending', 'expired', 'invalid');

-- Operational Areas Table (for real-time status engine)
CREATE TABLE operational_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operational Status Table (for real-time status tracking)
CREATE TABLE operational_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES operational_areas(id) ON DELETE CASCADE,
  status operational_status_enum NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  trend trend_enum DEFAULT 'stable',
  details TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust Indicators Table (for trust authority framework)
CREATE TABLE trust_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type trust_indicator_enum NOT NULL,
  title VARCHAR(255) NOT NULL,
  value_text VARCHAR(255),
  value_numeric DECIMAL(15,4),
  verification_status verification_enum DEFAULT 'pending',
  verification_url VARCHAR(500),
  display_priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Metrics Table (for business intelligence)
CREATE TABLE business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_category VARCHAR(100) NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  target_value DECIMAL(15,4),
  unit VARCHAR(50),
  measurement_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_name, metric_category, measurement_date)
);

-- Analytics Events Table (for behavioral tracking)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  user_session VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive Models Table (for AI/ML capabilities)
CREATE TABLE predictive_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL,
  accuracy DECIMAL(5,4),
  training_data_size INTEGER,
  last_trained TIMESTAMP WITH TIME ZONE,
  model_parameters JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Events Table (for security monitoring)
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session Activity Table (for session security)
CREATE TABLE session_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  activity_type VARCHAR(100) NOT NULL,
  url VARCHAR(500),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Content Settings Table (for dynamic content management)
CREATE TABLE content_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  value_type VARCHAR(20) DEFAULT 'text' CHECK (value_type IN ('text', 'json', 'html', 'markdown')),
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section, key)
);

-- Create indexes for performance
CREATE INDEX idx_operational_status_area_id ON operational_status(area_id);
CREATE INDEX idx_operational_status_last_updated ON operational_status(last_updated);
CREATE INDEX idx_operational_status_status ON operational_status(status);

CREATE INDEX idx_trust_indicators_type ON trust_indicators(type);
CREATE INDEX idx_trust_indicators_is_active ON trust_indicators(is_active);
CREATE INDEX idx_trust_indicators_display_priority ON trust_indicators(display_priority);

CREATE INDEX idx_business_metrics_name_category ON business_metrics(metric_name, metric_category);
CREATE INDEX idx_business_metrics_date ON business_metrics(measurement_date);
CREATE INDEX idx_business_metrics_category ON business_metrics(metric_category);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_session ON analytics_events(user_session);

CREATE INDEX idx_predictive_models_type ON predictive_models(type);
CREATE INDEX idx_predictive_models_is_active ON predictive_models(is_active);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_timestamp ON security_events(created_at);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);

CREATE INDEX idx_session_activity_user_id ON session_activity(user_id);
CREATE INDEX idx_session_activity_session_id ON session_activity(session_id);
CREATE INDEX idx_session_activity_timestamp ON session_activity(timestamp);
CREATE INDEX idx_session_activity_ip ON session_activity(ip_address);

CREATE INDEX idx_content_settings_section ON content_settings(section);
CREATE INDEX idx_content_settings_is_active ON content_settings(is_active);

-- Add updated_at triggers
CREATE TRIGGER update_operational_areas_updated_at 
  BEFORE UPDATE ON operational_areas 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_settings_updated_at 
  BEFORE UPDATE ON content_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE operational_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_settings ENABLE ROW LEVEL SECURITY;

-- Operational Areas Policies
CREATE POLICY "Public can view active operational areas" ON operational_areas
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage operational areas" ON operational_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Operational Status Policies
CREATE POLICY "Public can view operational status" ON operational_status
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage operational status" ON operational_status
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can update operational status" ON operational_status
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Trust Indicators Policies
CREATE POLICY "Public can view active trust indicators" ON trust_indicators
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage trust indicators" ON trust_indicators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Business Metrics Policies
CREATE POLICY "Admins can view business metrics" ON business_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "System can insert business metrics" ON business_metrics
  FOR INSERT WITH CHECK (true);

-- Analytics Events Policies
CREATE POLICY "Public can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view analytics events" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Security Events Policies
CREATE POLICY "System can insert security events" ON security_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage security events" ON security_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Session Activity Policies
CREATE POLICY "Users can view own session activity" ON session_activity
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert session activity" ON session_activity
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all session activity" ON session_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Content Settings Policies
CREATE POLICY "Public can view active content settings" ON content_settings
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage content settings" ON content_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Enterprise Functions

-- Function to get current operational status
CREATE OR REPLACE FUNCTION get_operational_status()
RETURNS TABLE (
  area_name VARCHAR(255),
  status operational_status_enum,
  metrics JSONB,
  trend trend_enum,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    oa.name,
    os.status,
    os.metrics,
    os.trend,
    os.last_updated
  FROM operational_areas oa
  LEFT JOIN LATERAL (
    SELECT status, metrics, trend, last_updated
    FROM operational_status 
    WHERE area_id = oa.id 
    ORDER BY last_updated DESC 
    LIMIT 1
  ) os ON true
  WHERE oa.is_active = true
  ORDER BY oa.display_order, oa.name;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update operational status
CREATE OR REPLACE FUNCTION update_operational_status(
  p_area_name VARCHAR(255),
  p_status operational_status_enum,
  p_metrics JSONB DEFAULT '{}',
  p_trend trend_enum DEFAULT 'stable',
  p_details TEXT DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
  area_id UUID;
  status_id UUID;
BEGIN
  -- Get area ID
  SELECT id INTO area_id
  FROM operational_areas
  WHERE name = p_area_name AND is_active = true;
  
  IF area_id IS NULL THEN
    RAISE EXCEPTION 'Operational area not found: %', p_area_name;
  END IF;
  
  -- Insert new status
  INSERT INTO operational_status (
    area_id,
    status,
    metrics,
    trend,
    details,
    updated_by
  ) VALUES (
    area_id,
    p_status,
    p_metrics,
    p_trend,
    p_details,
    auth.uid()
  ) RETURNING id INTO status_id;
  
  RETURN status_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record business metric
CREATE OR REPLACE FUNCTION record_business_metric(
  p_metric_name VARCHAR(100),
  p_category VARCHAR(100),
  p_value DECIMAL(15,4),
  p_target_value DECIMAL(15,4) DEFAULT NULL,
  p_unit VARCHAR(50) DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO business_metrics (
    metric_name,
    metric_category,
    value,
    target_value,
    unit,
    measurement_date,
    metadata
  ) VALUES (
    p_metric_name,
    p_category,
    p_value,
    p_target_value,
    p_unit,
    p_date,
    p_metadata
  ) 
  ON CONFLICT (metric_name, metric_category, measurement_date)
  DO UPDATE SET
    value = EXCLUDED.value,
    target_value = EXCLUDED.target_value,
    unit = EXCLUDED.unit,
    metadata = EXCLUDED.metadata
  RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security event
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type VARCHAR(100),
  p_severity VARCHAR(20),
  p_description TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO security_events (
    event_type,
    severity,
    description,
    ip_address,
    user_agent,
    user_id,
    session_id,
    metadata
  ) VALUES (
    p_event_type,
    p_severity,
    p_description,
    p_ip_address,
    p_user_agent,
    p_user_id,
    p_session_id,
    p_metadata
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default operational areas
INSERT INTO operational_areas (name, description, display_order) VALUES
  ('Inventory Availability', 'Real-time inventory status and availability tracking', 1),
  ('Supply Chain Health', 'Supplier relationships and logistics capacity monitoring', 2),
  ('Quality Assurance Status', 'Quality control processes and certification status', 3),
  ('Logistics Capacity', 'Delivery and transportation capacity indicators', 4),
  ('Customer Service Level', 'Support response times and satisfaction metrics', 5),
  ('Business Operations', 'Overall business operational health and performance', 6);

-- Insert default trust indicators
INSERT INTO trust_indicators (type, title, value_text, display_priority, is_active) VALUES
  ('performance_metric', 'Years of Operation', '15+ Years', 1, true),
  ('performance_metric', 'Active Projects', '50+ Projects', 2, true),
  ('performance_metric', 'Client Satisfaction', '98% Satisfaction Rate', 3, true),
  ('certification', 'ISO 9001:2015', 'Quality Management Certified', 4, true),
  ('certification', 'Saudi Standards', 'SASO Compliant', 5, true),
  ('performance_metric', 'On-Time Delivery', '99.2% On-Time Rate', 6, true);

-- Insert default content settings
INSERT INTO content_settings (section, key, value, value_type) VALUES
  ('hero', 'title', 'Enterprise Industrial Solutions', 'text'),
  ('hero', 'subtitle', 'Your trusted partner for comprehensive industrial supply and equipment solutions', 'text'),
  ('company', 'established_year', '2008', 'text'),
  ('company', 'headquarters', 'Riyadh, Saudi Arabia', 'text'),
  ('company', 'specialization', 'Industrial Equipment & Safety Solutions', 'text'),
  ('contact', 'business_hours', 'Sunday - Thursday: 8:00 AM - 6:00 PM', 'text'),
  ('contact', 'response_time', 'Within 2 hours during business hours', 'text');

-- Create initial operational status
INSERT INTO operational_status (area_id, status, metrics, trend)
SELECT 
  id,
  'optimal'::operational_status_enum,
  '{"availability": 95, "response_time": 120, "quality_score": 98}'::jsonb,
  'stable'::trend_enum
FROM operational_areas
WHERE is_active = true;