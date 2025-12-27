-- Monitoring and Alerting System Tables
-- Tracks performance metrics, errors, and business KPIs
-- Requirements: 9.3, 10.2

-- Create performance metrics table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- 'ms', 'bytes', 'count', 'percentage', 'score'
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  context JSONB,
  tags TEXT[],
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id),
  url VARCHAR(500),
  user_agent TEXT,
  server_side BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create error events table
CREATE TABLE error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack TEXT,
  url VARCHAR(500),
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  server_side BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alert rules table
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  metric VARCHAR(255) NOT NULL,
  condition VARCHAR(20) NOT NULL CHECK (condition IN ('greater_than', 'less_than', 'equals', 'not_equals')),
  threshold DECIMAL(15,4) NOT NULL,
  time_window INTEGER NOT NULL, -- minutes
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  channels TEXT[] DEFAULT ARRAY['email'], -- 'email', 'slack', 'webhook'
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  data JSONB,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  alert_rule_id UUID REFERENCES alert_rules(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system health table
CREATE TABLE system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  error_rate DECIMAL(5,2), -- percentage
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_performance_metrics_name ON performance_metrics(name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_tags ON performance_metrics USING GIN(tags);

CREATE INDEX idx_error_events_severity ON error_events(severity);
CREATE INDEX idx_error_events_timestamp ON error_events(timestamp);
CREATE INDEX idx_error_events_session_id ON error_events(session_id);
CREATE INDEX idx_error_events_user_id ON error_events(user_id);
CREATE INDEX idx_error_events_resolved ON error_events(resolved);

CREATE INDEX idx_alert_rules_metric ON alert_rules(metric);
CREATE INDEX idx_alert_rules_is_active ON alert_rules(is_active);

CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_triggered_at ON alerts(triggered_at);
CREATE INDEX idx_alerts_alert_rule_id ON alerts(alert_rule_id);

CREATE INDEX idx_system_health_component ON system_health(component);
CREATE INDEX idx_system_health_status ON system_health(status);
CREATE INDEX idx_system_health_last_check ON system_health(last_check);

-- Add updated_at triggers
CREATE TRIGGER update_alert_rules_updated_at 
  BEFORE UPDATE ON alert_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Performance Metrics Policies
-- Public can insert metrics (for client-side tracking)
CREATE POLICY "Public can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

-- Admins can view all metrics
CREATE POLICY "Admins can view performance metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Error Events Policies
-- Public can insert errors (for client-side error tracking)
CREATE POLICY "Public can insert error events" ON error_events
  FOR INSERT WITH CHECK (true);

-- Admins can view and manage errors
CREATE POLICY "Admins can manage error events" ON error_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Alert Rules Policies
-- Only admins can manage alert rules
CREATE POLICY "Admins can manage alert rules" ON alert_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Alerts Policies
-- Only admins can view and manage alerts
CREATE POLICY "Admins can manage alerts" ON alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- System Health Policies
-- System can insert/update health status
CREATE POLICY "System can manage system health" ON system_health
  FOR ALL USING (true);

-- Admins can view system health
CREATE POLICY "Admins can view system health" ON system_health
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Functions for monitoring

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
  time_range INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
  metric_name VARCHAR(255),
  avg_value DECIMAL(15,4),
  min_value DECIMAL(15,4),
  max_value DECIMAL(15,4),
  count_values BIGINT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    pm.name,
    AVG(pm.value)::DECIMAL(15,4),
    MIN(pm.value)::DECIMAL(15,4),
    MAX(pm.value)::DECIMAL(15,4),
    COUNT(*)::BIGINT
  FROM performance_metrics pm
  WHERE pm.timestamp >= NOW() - time_range
  GROUP BY pm.name
  ORDER BY pm.name;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get error summary
CREATE OR REPLACE FUNCTION get_error_summary(
  time_range INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
  severity VARCHAR(20),
  error_count BIGINT,
  unique_messages BIGINT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    ee.severity,
    COUNT(*)::BIGINT,
    COUNT(DISTINCT ee.message)::BIGINT
  FROM error_events ee
  WHERE ee.timestamp >= NOW() - time_range
  GROUP BY ee.severity
  ORDER BY 
    CASE ee.severity 
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update system health
CREATE OR REPLACE FUNCTION update_system_health(
  p_component VARCHAR(100),
  p_status VARCHAR(20),
  p_response_time_ms INTEGER DEFAULT NULL,
  p_error_rate DECIMAL(5,2) DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
  health_id UUID;
BEGIN
  INSERT INTO system_health (
    component,
    status,
    response_time_ms,
    error_rate,
    metadata
  ) VALUES (
    p_component,
    p_status,
    p_response_time_ms,
    p_error_rate,
    p_metadata
  ) RETURNING id INTO health_id;
  
  RETURN health_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default alert rules
INSERT INTO alert_rules (name, description, metric, condition, threshold, time_window, severity, channels) VALUES
  ('High Page Load Time', 'Alert when average page load time exceeds 3 seconds', 'page_load_time', 'greater_than', 3000, 15, 'medium', ARRAY['email']),
  ('High Error Rate', 'Alert when error rate is high', 'api_response_time', 'greater_than', 5000, 10, 'high', ARRAY['email', 'slack']),
  ('Critical Errors', 'Alert on any critical errors', 'error_count_critical', 'greater_than', 0, 5, 'critical', ARRAY['email', 'slack']),
  ('Low Availability', 'Alert when availability drops below 99%', 'availability_percentage', 'less_than', 99, 30, 'high', ARRAY['email', 'slack']),
  ('High Memory Usage', 'Alert when memory usage exceeds 80%', 'memory_usage_percentage', 'greater_than', 80, 15, 'medium', ARRAY['email']),
  ('Database Connection Issues', 'Alert on database connection problems', 'database_connection_errors', 'greater_than', 5, 10, 'high', ARRAY['email', 'slack']);

-- Insert initial system health records
INSERT INTO system_health (component, status, metadata) VALUES
  ('web_server', 'healthy', '{"version": "2.0", "deployment": "initial"}'),
  ('database', 'healthy', '{"provider": "supabase", "region": "us-east-1"}'),
  ('feature_flags', 'healthy', '{"active_flags": 10}'),
  ('monitoring', 'healthy', '{"tables_created": true}');