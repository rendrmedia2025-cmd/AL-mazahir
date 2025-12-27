-- Deployments Tracking Table
-- Tracks deployment history and rollback capabilities
-- Requirements: 9.1, 9.2, 9.6

-- Create deployment status enum
CREATE TYPE deployment_status_enum AS ENUM (
  'pending',
  'success',
  'failed',
  'rollback',
  'cancelled'
);

-- Create deployments table
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_sha VARCHAR(40) NOT NULL,
  deployment_url VARCHAR(500),
  environment VARCHAR(50) NOT NULL DEFAULT 'production',
  status deployment_status_enum NOT NULL DEFAULT 'pending',
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  deployed_by VARCHAR(255), -- GitHub actor or user ID
  metadata JSONB, -- Store additional deployment info
  rollback_target_id UUID REFERENCES deployments(id),
  health_check_passed BOOLEAN DEFAULT NULL,
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deployment health checks table
CREATE TABLE deployment_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
  check_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'passed', 'failed', 'warning'
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for performance
CREATE INDEX idx_deployments_environment ON deployments(environment);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_deployed_at ON deployments(deployed_at);
CREATE INDEX idx_deployments_commit_sha ON deployments(commit_sha);

CREATE INDEX idx_deployment_health_checks_deployment_id ON deployment_health_checks(deployment_id);
CREATE INDEX idx_deployment_health_checks_status ON deployment_health_checks(status);
CREATE INDEX idx_deployment_health_checks_checked_at ON deployment_health_checks(checked_at);

-- Add updated_at trigger
CREATE TRIGGER update_deployments_updated_at 
  BEFORE UPDATE ON deployments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_health_checks ENABLE ROW LEVEL SECURITY;

-- Deployments Policies
-- Only admins can view deployment history
CREATE POLICY "Admins can view deployments" ON deployments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- System can insert deployment records
CREATE POLICY "System can insert deployments" ON deployments
  FOR INSERT WITH CHECK (true);

-- System can update deployment records
CREATE POLICY "System can update deployments" ON deployments
  FOR UPDATE USING (true);

-- Health Checks Policies
-- Only admins can view health checks
CREATE POLICY "Admins can view health checks" ON deployment_health_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- System can manage health checks
CREATE POLICY "System can manage health checks" ON deployment_health_checks
  FOR ALL USING (true);

-- Function to create deployments table (for scripts)
CREATE OR REPLACE FUNCTION create_deployments_table()
RETURNS VOID AS $
BEGIN
  -- This function exists to allow scripts to create the table if needed
  -- The table is already created above, so this is a no-op
  RETURN;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest successful deployment
CREATE OR REPLACE FUNCTION get_latest_successful_deployment(env TEXT DEFAULT 'production')
RETURNS TABLE (
  id UUID,
  commit_sha VARCHAR(40),
  deployment_url VARCHAR(500),
  deployed_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  SELECT d.id, d.commit_sha, d.deployment_url, d.deployed_at
  FROM deployments d
  WHERE d.environment = env 
    AND d.status = 'success'
    AND d.health_check_passed = true
  ORDER BY d.deployed_at DESC
  LIMIT 1;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record deployment health check
CREATE OR REPLACE FUNCTION record_health_check(
  p_deployment_id UUID,
  p_check_name VARCHAR(100),
  p_status VARCHAR(20),
  p_response_time_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
  check_id UUID;
BEGIN
  INSERT INTO deployment_health_checks (
    deployment_id,
    check_name,
    status,
    response_time_ms,
    error_message,
    metadata
  ) VALUES (
    p_deployment_id,
    p_check_name,
    p_status,
    p_response_time_ms,
    p_error_message,
    p_metadata
  ) RETURNING id INTO check_id;
  
  -- Update deployment health status
  UPDATE deployments 
  SET health_check_passed = (
    SELECT NOT EXISTS (
      SELECT 1 FROM deployment_health_checks 
      WHERE deployment_id = p_deployment_id 
        AND status = 'failed'
    )
  )
  WHERE id = p_deployment_id;
  
  RETURN check_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial deployment record for current state
INSERT INTO deployments (
  commit_sha,
  deployment_url,
  environment,
  status,
  deployed_by,
  health_check_passed,
  metadata
) VALUES (
  'initial-state',
  'https://al-mazahir.vercel.app',
  'production',
  'success',
  'system-migration',
  true,
  '{"migration": "initial_deployment_record", "version": "2.0"}'
);