-- Feature Flags System Migration
-- Enables gradual rollout and zero-downtime deployment capabilities

-- Create feature flag status enum
CREATE TYPE feature_flag_status_enum AS ENUM (
  'disabled',
  'enabled',
  'rollout',
  'deprecated'
);

-- Create rollout strategy enum
CREATE TYPE rollout_strategy_enum AS ENUM (
  'all_users',
  'percentage',
  'user_list',
  'admin_only'
);

-- Feature Flags Table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  status feature_flag_status_enum DEFAULT 'disabled',
  rollout_strategy rollout_strategy_enum DEFAULT 'all_users',
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  rollout_user_list TEXT[], -- Array of user IDs or email addresses
  environment VARCHAR(50) DEFAULT 'production',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Feature Flag Audit Log Table
CREATE TABLE feature_flag_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'enabled', 'disabled', 'rollout_changed'
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature Flag Usage Analytics Table
CREATE TABLE feature_flag_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- Can be anonymous user ID or authenticated user ID
  session_id VARCHAR(255),
  flag_evaluated BOOLEAN NOT NULL,
  flag_enabled BOOLEAN NOT NULL,
  evaluation_context JSONB, -- Store context like user agent, location, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_status ON feature_flags(status);
CREATE INDEX idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX idx_feature_flags_expires_at ON feature_flags(expires_at);

CREATE INDEX idx_feature_flag_audit_feature_flag_id ON feature_flag_audit(feature_flag_id);
CREATE INDEX idx_feature_flag_audit_created_at ON feature_flag_audit(created_at);
CREATE INDEX idx_feature_flag_audit_action ON feature_flag_audit(action);

CREATE INDEX idx_feature_flag_analytics_feature_flag_id ON feature_flag_analytics(feature_flag_id);
CREATE INDEX idx_feature_flag_analytics_created_at ON feature_flag_analytics(created_at);
CREATE INDEX idx_feature_flag_analytics_user_id ON feature_flag_analytics(user_id);
CREATE INDEX idx_feature_flag_analytics_session_id ON feature_flag_analytics(session_id);

-- Add updated_at trigger for feature_flags
CREATE TRIGGER update_feature_flags_updated_at 
  BEFORE UPDATE ON feature_flags 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_analytics ENABLE ROW LEVEL SECURITY;

-- Feature Flags Policies
-- Public read access for active feature flags (needed for client-side evaluation)
CREATE POLICY "Public can view active feature flags" ON feature_flags
  FOR SELECT USING (
    status IN ('enabled', 'rollout') AND 
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Admin full access
CREATE POLICY "Admins can manage feature flags" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Feature Flag Audit Policies
-- Only admins can view audit logs
CREATE POLICY "Admins can view feature flag audit" ON feature_flag_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert feature flag audit" ON feature_flag_audit
  FOR INSERT WITH CHECK (true);

-- Feature Flag Analytics Policies
-- Only admins can view analytics
CREATE POLICY "Admins can view feature flag analytics" ON feature_flag_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- System can insert analytics
CREATE POLICY "System can insert feature flag analytics" ON feature_flag_analytics
  FOR INSERT WITH CHECK (true);

-- Function to log feature flag changes
CREATE OR REPLACE FUNCTION log_feature_flag_audit()
RETURNS TRIGGER AS $
DECLARE
  old_json JSONB;
  new_json JSONB;
  action_type VARCHAR(100);
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    old_json := NULL;
    new_json := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      action_type := CASE 
        WHEN NEW.status = 'enabled' THEN 'enabled'
        WHEN NEW.status = 'disabled' THEN 'disabled'
        WHEN NEW.status = 'rollout' THEN 'rollout_started'
        ELSE 'updated'
      END;
    ELSIF OLD.rollout_percentage != NEW.rollout_percentage OR 
          OLD.rollout_strategy != NEW.rollout_strategy OR
          OLD.rollout_user_list != NEW.rollout_user_list THEN
      action_type := 'rollout_changed';
    ELSE
      action_type := 'updated';
    END IF;
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    old_json := to_jsonb(OLD);
    new_json := NULL;
  END IF;

  -- Insert audit record
  INSERT INTO feature_flag_audit (
    feature_flag_id,
    action,
    old_values,
    new_values,
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    action_type,
    old_json,
    new_json,
    auth.uid(),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );

  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger
CREATE TRIGGER feature_flag_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION log_feature_flag_audit();

-- Insert default feature flags for the enterprise enhancement layer
INSERT INTO feature_flags (name, description, status, environment, created_by) VALUES
  ('availability_indicators', 'Live product availability indicators on catalog pages', 'enabled', 'production', NULL),
  ('smart_enquiry_form', 'Enhanced contact form with lead intelligence', 'enabled', 'production', NULL),
  ('dynamic_cta_logic', 'Context-aware call-to-action buttons based on availability', 'enabled', 'production', NULL),
  ('admin_dashboard', 'Enterprise admin control panel', 'enabled', 'production', NULL),
  ('trust_enhancements', 'Animated counters and trust indicators', 'enabled', 'production', NULL),
  ('business_intelligence', 'Advanced analytics and business metrics', 'rollout', 'production', NULL),
  ('industries_mapping', 'Industries served and capability mapping', 'disabled', 'production', NULL),
  ('insights_section', 'Business insights and content management', 'disabled', 'production', NULL),
  ('enterprise_layout', 'Professional B2B layout transformation', 'disabled', 'production', NULL),
  ('performance_monitoring', 'Advanced performance and error tracking', 'enabled', 'production', NULL);

-- Update rollout percentages for gradual rollout features
UPDATE feature_flags 
SET rollout_percentage = 25, rollout_strategy = 'percentage'
WHERE name = 'business_intelligence';