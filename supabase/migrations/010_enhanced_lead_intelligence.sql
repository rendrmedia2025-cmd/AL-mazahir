-- Enhanced Lead Intelligence System Migration
-- Implements comprehensive lead intelligence with behavioral analytics
-- Requirements: 3.1, 3.2, 3.3, 3.4, 3.8

-- Create enhanced lead intelligence types
CREATE TYPE decision_authority_enum AS ENUM (
  'decision_maker',
  'influencer', 
  'end_user',
  'gatekeeper'
);

CREATE TYPE budget_range_enum AS ENUM (
  'under_10k',
  '10k_50k',
  '50k_100k',
  '100k_500k',
  '500k_1m',
  'over_1m'
);

CREATE TYPE project_timeline_enum AS ENUM (
  'immediate',
  'within_month',
  'within_quarter',
  'within_year',
  'planning_phase'
);

CREATE TYPE lead_priority_enum AS ENUM (
  'low',
  'medium', 
  'high',
  'critical'
);

CREATE TYPE interaction_type_enum AS ENUM (
  'page_view',
  'form_submission',
  'document_download',
  'email_click',
  'phone_call',
  'meeting',
  'quote_request'
);

-- Enhanced Leads Table (extends existing enhanced_leads)
-- Add new columns to existing table
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS company_size VARCHAR(50);
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS industry_sector VARCHAR(100);
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS decision_authority decision_authority_enum;
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS budget_range budget_range_enum;
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS project_timeline project_timeline_enum;
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS priority lead_priority_enum DEFAULT 'medium';
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS routing_notes TEXT;
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS conversion_probability DECIMAL(5,4);
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMP WITH TIME ZONE;
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS total_engagement_time INTEGER DEFAULT 0; -- seconds
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS page_views_count INTEGER DEFAULT 0;
ALTER TABLE enhanced_leads ADD COLUMN IF NOT EXISTS documents_downloaded INTEGER DEFAULT 0;

-- Lead Events Table (for detailed interaction tracking)
CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  event_type interaction_type_enum NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  page_url VARCHAR(500),
  session_id VARCHAR(255),
  duration_seconds INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id), -- if logged in
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Lead Predictions Table (for AI/ML predictions)
CREATE TABLE lead_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  prediction_type VARCHAR(100) NOT NULL, -- 'conversion_probability', 'value_estimate', 'timeline_prediction'
  probability DECIMAL(5,4) NOT NULL,
  confidence_level DECIMAL(5,4) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  prediction_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Lead Scoring Rules Table (configurable scoring system)
CREATE TABLE lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  condition_field VARCHAR(100) NOT NULL, -- 'company_size', 'industry_sector', 'budget_range', etc.
  condition_operator VARCHAR(20) NOT NULL, -- 'equals', 'contains', 'greater_than', etc.
  condition_value VARCHAR(255) NOT NULL,
  score_points INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Routing Rules Table (intelligent routing system)
CREATE TABLE lead_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0, -- higher number = higher priority
  conditions JSONB NOT NULL, -- complex conditions for routing
  assigned_to UUID REFERENCES auth.users(id),
  team_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Follow-up Tasks Table (automated task management)
CREATE TABLE lead_followup_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  task_type VARCHAR(100) NOT NULL, -- 'call', 'email', 'meeting', 'quote'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  priority lead_priority_enum DEFAULT 'medium',
  automated BOOLEAN DEFAULT false, -- true if created by automation
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Communication Log Table (track all communications)
CREATE TABLE lead_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  communication_type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'whatsapp', 'meeting'
  direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
  subject VARCHAR(255),
  content TEXT,
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_received BOOLEAN DEFAULT false,
  response_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- store additional data like email headers, call duration, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Behavioral Analytics Table (detailed behavior tracking)
CREATE TABLE lead_behavior_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  total_session_time INTEGER NOT NULL, -- seconds
  pages_visited INTEGER NOT NULL,
  bounce_rate DECIMAL(5,4), -- 0.0 to 1.0
  engagement_score INTEGER, -- calculated score based on behavior
  device_info JSONB DEFAULT '{}',
  location_data JSONB DEFAULT '{}', -- country, city if available
  referrer_data JSONB DEFAULT '{}',
  conversion_events JSONB DEFAULT '[]', -- array of conversion events
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX idx_lead_events_event_type ON lead_events(event_type);
CREATE INDEX idx_lead_events_timestamp ON lead_events(timestamp);
CREATE INDEX idx_lead_events_session_id ON lead_events(session_id);

CREATE INDEX idx_lead_predictions_lead_id ON lead_predictions(lead_id);
CREATE INDEX idx_lead_predictions_type ON lead_predictions(prediction_type);
CREATE INDEX idx_lead_predictions_created_at ON lead_predictions(created_at);
CREATE INDEX idx_lead_predictions_expires_at ON lead_predictions(expires_at);

CREATE INDEX idx_lead_scoring_rules_is_active ON lead_scoring_rules(is_active);
CREATE INDEX idx_lead_scoring_rules_condition_field ON lead_scoring_rules(condition_field);

CREATE INDEX idx_lead_routing_rules_is_active ON lead_routing_rules(is_active);
CREATE INDEX idx_lead_routing_rules_priority ON lead_routing_rules(priority);
CREATE INDEX idx_lead_routing_rules_assigned_to ON lead_routing_rules(assigned_to);

CREATE INDEX idx_lead_followup_tasks_lead_id ON lead_followup_tasks(lead_id);
CREATE INDEX idx_lead_followup_tasks_assigned_to ON lead_followup_tasks(assigned_to);
CREATE INDEX idx_lead_followup_tasks_due_date ON lead_followup_tasks(due_date);
CREATE INDEX idx_lead_followup_tasks_status ON lead_followup_tasks(status);

CREATE INDEX idx_lead_communications_lead_id ON lead_communications(lead_id);
CREATE INDEX idx_lead_communications_type ON lead_communications(communication_type);
CREATE INDEX idx_lead_communications_sent_at ON lead_communications(sent_at);

CREATE INDEX idx_lead_behavior_analytics_lead_id ON lead_behavior_analytics(lead_id);
CREATE INDEX idx_lead_behavior_analytics_session_id ON lead_behavior_analytics(session_id);
CREATE INDEX idx_lead_behavior_analytics_session_start ON lead_behavior_analytics(session_start);

-- Add indexes to enhanced_leads for new columns
CREATE INDEX idx_enhanced_leads_lead_score ON enhanced_leads(lead_score);
CREATE INDEX idx_enhanced_leads_priority ON enhanced_leads(priority);
CREATE INDEX idx_enhanced_leads_company_size ON enhanced_leads(company_size);
CREATE INDEX idx_enhanced_leads_industry_sector ON enhanced_leads(industry_sector);
CREATE INDEX idx_enhanced_leads_budget_range ON enhanced_leads(budget_range);
CREATE INDEX idx_enhanced_leads_last_interaction ON enhanced_leads(last_interaction);

-- Add updated_at triggers
CREATE TRIGGER update_lead_scoring_rules_updated_at 
  BEFORE UPDATE ON lead_scoring_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_routing_rules_updated_at 
  BEFORE UPDATE ON lead_routing_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_followup_tasks_updated_at 
  BEFORE UPDATE ON lead_followup_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_followup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_behavior_analytics ENABLE ROW LEVEL SECURITY;

-- Lead Events Policies
CREATE POLICY "System can insert lead events" ON lead_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view lead events" ON lead_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Lead Predictions Policies
CREATE POLICY "System can manage lead predictions" ON lead_predictions
  FOR ALL USING (true);

CREATE POLICY "Admins can view lead predictions" ON lead_predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Lead Scoring Rules Policies
CREATE POLICY "Admins can manage lead scoring rules" ON lead_scoring_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Lead Routing Rules Policies
CREATE POLICY "Admins can manage lead routing rules" ON lead_routing_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Lead Follow-up Tasks Policies
CREATE POLICY "Assigned users can view their tasks" ON lead_followup_tasks
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Assigned users can update their tasks" ON lead_followup_tasks
  FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Admins can manage all follow-up tasks" ON lead_followup_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Lead Communications Policies
CREATE POLICY "Admins can manage lead communications" ON lead_communications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Lead Behavior Analytics Policies
CREATE POLICY "System can insert behavior analytics" ON lead_behavior_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view behavior analytics" ON lead_behavior_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Enhanced Lead Intelligence Functions

-- Function to calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(p_lead_id UUID)
RETURNS INTEGER AS $
DECLARE
  total_score INTEGER := 0;
  lead_record RECORD;
  rule_record RECORD;
BEGIN
  -- Get lead data
  SELECT * INTO lead_record FROM enhanced_leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Apply scoring rules
  FOR rule_record IN 
    SELECT * FROM lead_scoring_rules WHERE is_active = true
  LOOP
    -- Simple scoring logic - can be enhanced with more complex conditions
    CASE rule_record.condition_field
      WHEN 'company_size' THEN
        IF lead_record.company_size = rule_record.condition_value THEN
          total_score := total_score + rule_record.score_points;
        END IF;
      WHEN 'industry_sector' THEN
        IF lead_record.industry_sector = rule_record.condition_value THEN
          total_score := total_score + rule_record.score_points;
        END IF;
      WHEN 'budget_range' THEN
        IF lead_record.budget_range::text = rule_record.condition_value THEN
          total_score := total_score + rule_record.score_points;
        END IF;
      WHEN 'urgency' THEN
        IF lead_record.urgency::text = rule_record.condition_value THEN
          total_score := total_score + rule_record.score_points;
        END IF;
    END CASE;
  END LOOP;
  
  -- Add behavioral scoring
  SELECT COALESCE(SUM(
    CASE 
      WHEN event_type = 'form_submission' THEN 20
      WHEN event_type = 'document_download' THEN 15
      WHEN event_type = 'page_view' THEN 2
      WHEN event_type = 'email_click' THEN 10
      ELSE 5
    END
  ), 0) INTO total_score
  FROM lead_events 
  WHERE lead_id = p_lead_id 
    AND timestamp >= NOW() - INTERVAL '30 days';
  
  -- Update lead score
  UPDATE enhanced_leads 
  SET lead_score = total_score,
      updated_at = NOW()
  WHERE id = p_lead_id;
  
  RETURN total_score;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to route lead based on rules
CREATE OR REPLACE FUNCTION route_lead(p_lead_id UUID)
RETURNS UUID AS $
DECLARE
  lead_record RECORD;
  routing_rule RECORD;
  assigned_user UUID;
BEGIN
  -- Get lead data
  SELECT * INTO lead_record FROM enhanced_leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Find matching routing rule (highest priority first)
  FOR routing_rule IN 
    SELECT * FROM lead_routing_rules 
    WHERE is_active = true 
    ORDER BY priority DESC
  LOOP
    -- Simple routing logic - can be enhanced with complex JSON conditions
    IF routing_rule.assigned_to IS NOT NULL THEN
      assigned_user := routing_rule.assigned_to;
      EXIT; -- Use first matching rule
    END IF;
  END LOOP;
  
  -- Update lead assignment
  IF assigned_user IS NOT NULL THEN
    UPDATE enhanced_leads 
    SET assigned_to = assigned_user,
        routing_notes = 'Auto-assigned by routing rule: ' || routing_rule.name,
        updated_at = NOW()
    WHERE id = p_lead_id;
  END IF;
  
  RETURN assigned_user;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create follow-up task
CREATE OR REPLACE FUNCTION create_followup_task(
  p_lead_id UUID,
  p_task_type VARCHAR(100),
  p_title VARCHAR(255),
  p_description TEXT DEFAULT NULL,
  p_due_hours INTEGER DEFAULT 24,
  p_assigned_to UUID DEFAULT NULL,
  p_priority lead_priority_enum DEFAULT 'medium',
  p_automated BOOLEAN DEFAULT false
)
RETURNS UUID AS $
DECLARE
  task_id UUID;
  lead_assigned_to UUID;
BEGIN
  -- Get lead assignment if no specific user provided
  IF p_assigned_to IS NULL THEN
    SELECT assigned_to INTO lead_assigned_to 
    FROM enhanced_leads 
    WHERE id = p_lead_id;
    
    p_assigned_to := lead_assigned_to;
  END IF;
  
  -- Create follow-up task
  INSERT INTO lead_followup_tasks (
    lead_id,
    task_type,
    title,
    description,
    due_date,
    assigned_to,
    priority,
    automated
  ) VALUES (
    p_lead_id,
    p_task_type,
    p_title,
    p_description,
    NOW() + (p_due_hours || ' hours')::INTERVAL,
    p_assigned_to,
    p_priority,
    p_automated
  ) RETURNING id INTO task_id;
  
  RETURN task_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record lead interaction
CREATE OR REPLACE FUNCTION record_lead_interaction(
  p_lead_id UUID,
  p_event_type interaction_type_enum,
  p_event_data JSONB DEFAULT '{}',
  p_page_url VARCHAR(500) DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
  event_id UUID;
BEGIN
  -- Insert lead event
  INSERT INTO lead_events (
    lead_id,
    event_type,
    event_data,
    page_url,
    session_id,
    duration_seconds,
    ip_address,
    user_agent
  ) VALUES (
    p_lead_id,
    p_event_type,
    p_event_data,
    p_page_url,
    p_session_id,
    p_duration_seconds,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  ) RETURNING id INTO event_id;
  
  -- Update lead interaction summary
  UPDATE enhanced_leads 
  SET last_interaction = NOW(),
      page_views_count = CASE WHEN p_event_type = 'page_view' THEN page_views_count + 1 ELSE page_views_count END,
      documents_downloaded = CASE WHEN p_event_type = 'document_download' THEN documents_downloaded + 1 ELSE documents_downloaded END,
      total_engagement_time = total_engagement_time + COALESCE(p_duration_seconds, 0),
      updated_at = NOW()
  WHERE id = p_lead_id;
  
  -- Recalculate lead score
  PERFORM calculate_lead_score(p_lead_id);
  
  RETURN event_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default lead scoring rules
INSERT INTO lead_scoring_rules (name, description, condition_field, condition_operator, condition_value, score_points) VALUES
  ('Large Company Size', 'Higher score for large companies', 'company_size', 'equals', 'large', 25),
  ('Medium Company Size', 'Medium score for medium companies', 'company_size', 'equals', 'medium', 15),
  ('Construction Industry', 'Higher score for construction sector', 'industry_sector', 'equals', 'construction', 20),
  ('Oil & Gas Industry', 'Higher score for oil & gas sector', 'industry_sector', 'equals', 'oil_gas', 25),
  ('Manufacturing Industry', 'Higher score for manufacturing sector', 'industry_sector', 'equals', 'manufacturing', 20),
  ('High Budget Range', 'Higher score for high budget projects', 'budget_range', 'equals', 'over_1m', 30),
  ('Medium-High Budget', 'Good score for medium-high budget', 'budget_range', 'equals', '500k_1m', 25),
  ('Medium Budget', 'Medium score for medium budget', 'budget_range', 'equals', '100k_500k', 15),
  ('Immediate Urgency', 'Higher score for immediate needs', 'urgency', 'equals', 'immediate', 20),
  ('Short Term Urgency', 'Good score for short term needs', 'urgency', 'equals', '1-2_weeks', 15);

-- Insert default routing rules
INSERT INTO lead_routing_rules (name, description, priority, conditions, team_name) VALUES
  ('High Value Leads', 'Route high-value leads to senior team', 100, '{"budget_range": ["500k_1m", "over_1m"], "lead_score": {"min": 80}}', 'Senior Sales Team'),
  ('Construction Projects', 'Route construction leads to construction specialists', 80, '{"industry_sector": ["construction"], "lead_score": {"min": 50}}', 'Construction Team'),
  ('Oil & Gas Projects', 'Route oil & gas leads to specialized team', 90, '{"industry_sector": ["oil_gas"], "lead_score": {"min": 60}}', 'Oil & Gas Team'),
  ('Immediate Needs', 'Route urgent leads to rapid response team', 70, '{"urgency": ["immediate"], "lead_score": {"min": 40}}', 'Rapid Response Team'),
  ('Default Routing', 'Default routing for all other leads', 10, '{}', 'General Sales Team');