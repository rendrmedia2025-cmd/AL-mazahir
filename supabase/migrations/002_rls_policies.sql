-- Enable Row Level Security on all tables
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Product Categories Policies
-- Public read access for active categories
CREATE POLICY "Public can view active product categories" ON product_categories
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage product categories" ON product_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Availability Status Policies
-- Public read access
CREATE POLICY "Public can view availability status" ON availability_status
  FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admins can manage availability status" ON availability_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Enhanced Leads Policies
-- Public can insert (for form submissions)
CREATE POLICY "Public can submit leads" ON enhanced_leads
  FOR INSERT WITH CHECK (true);

-- Admins can view and manage all leads
CREATE POLICY "Admins can manage leads" ON enhanced_leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Admin Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON admin_profiles
  FOR SELECT USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON admin_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true AND role = 'admin'
    )
  );

-- Only admins can update profiles
CREATE POLICY "Admins can update profiles" ON admin_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true AND role = 'admin'
    )
  );

-- Audit Log Policies
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- System can insert audit logs (no user restriction for logging)
CREATE POLICY "System can insert audit logs" ON audit_log
  FOR INSERT WITH CHECK (true);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_profiles 
    WHERE id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action VARCHAR(100),
  p_resource_type VARCHAR(100),
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;