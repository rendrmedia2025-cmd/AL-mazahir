-- Enterprise Enhancement Layer - Additional Tables
-- Migration for Phase 2 enterprise features

-- Create additional enum types for enterprise features
CREATE TYPE insight_category_enum AS ENUM (
  'company_update',
  'product_announcement',
  'safety_guideline',
  'industry_insight',
  'project_showcase'
);

CREATE TYPE analytics_event_enum AS ENUM (
  'form_view',
  'form_start',
  'form_submit',
  'whatsapp_click',
  'email_click',
  'category_view',
  'availability_check'
);

-- Industries and Capabilities Tables
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon_name VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  project_count INTEGER DEFAULT 0,
  years_experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE industry_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
  capability_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE industry_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
  certification_name VARCHAR(255) NOT NULL,
  issuing_body VARCHAR(255),
  valid_until DATE,
  certificate_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Insights and Content Management
CREATE TABLE business_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category insight_category_enum NOT NULL,
  featured_image_url VARCHAR(500),
  author_id UUID REFERENCES auth.users(id),
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  seo_title VARCHAR(255),
  seo_description TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Analytics and Business Intelligence
CREATE TABLE lead_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES enhanced_leads(id) ON DELETE CASCADE,
  event_type analytics_event_enum NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255),
  page_url VARCHAR(500),
  user_agent TEXT
);

CREATE TABLE business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  metric_date DATE NOT NULL,
  category VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_name, metric_date, category)
);

-- Create performance indexes for enterprise tables
CREATE INDEX idx_industries_slug ON industries(slug);
CREATE INDEX idx_industries_is_active ON industries(is_active);
CREATE INDEX idx_industries_display_order ON industries(display_order);

CREATE INDEX idx_industry_capabilities_industry_id ON industry_capabilities(industry_id);
CREATE INDEX idx_industry_capabilities_is_featured ON industry_capabilities(is_featured);

CREATE INDEX idx_industry_certifications_industry_id ON industry_certifications(industry_id);
CREATE INDEX idx_industry_certifications_valid_until ON industry_certifications(valid_until);

CREATE INDEX idx_business_insights_slug ON business_insights(slug);
CREATE INDEX idx_business_insights_category ON business_insights(category);
CREATE INDEX idx_business_insights_is_published ON business_insights(is_published);
CREATE INDEX idx_business_insights_published_at ON business_insights(published_at);
CREATE INDEX idx_business_insights_author_id ON business_insights(author_id);

CREATE INDEX idx_lead_analytics_lead_id ON lead_analytics(lead_id);
CREATE INDEX idx_lead_analytics_event_type ON lead_analytics(event_type);
CREATE INDEX idx_lead_analytics_timestamp ON lead_analytics(timestamp);
CREATE INDEX idx_lead_analytics_session_id ON lead_analytics(session_id);

CREATE INDEX idx_business_metrics_metric_name ON business_metrics(metric_name);
CREATE INDEX idx_business_metrics_metric_date ON business_metrics(metric_date);
CREATE INDEX idx_business_metrics_category ON business_metrics(category);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_industries_updated_at 
  BEFORE UPDATE ON industries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_insights_updated_at 
  BEFORE UPDATE ON business_insights 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security to new tables
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;

-- Industries Policies
-- Public read access for active industries
CREATE POLICY "Public can view active industries" ON industries
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage industries" ON industries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Industry Capabilities Policies
-- Public read access through active industries
CREATE POLICY "Public can view industry capabilities" ON industry_capabilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM industries 
      WHERE id = industry_capabilities.industry_id AND is_active = true
    )
  );

-- Admin full access
CREATE POLICY "Admins can manage industry capabilities" ON industry_capabilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Industry Certifications Policies
-- Public read access through active industries
CREATE POLICY "Public can view industry certifications" ON industry_certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM industries 
      WHERE id = industry_certifications.industry_id AND is_active = true
    )
  );

-- Admin full access
CREATE POLICY "Admins can manage industry certifications" ON industry_certifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Business Insights Policies
-- Public read access for published insights
CREATE POLICY "Public can view published insights" ON business_insights
  FOR SELECT USING (is_published = true);

-- Admin full access
CREATE POLICY "Admins can manage business insights" ON business_insights
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Lead Analytics Policies
-- Only admins can view analytics
CREATE POLICY "Admins can view lead analytics" ON lead_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- System can insert analytics (no user restriction for tracking)
CREATE POLICY "System can insert lead analytics" ON lead_analytics
  FOR INSERT WITH CHECK (true);

-- Business Metrics Policies
-- Only admins can view business metrics
CREATE POLICY "Admins can view business metrics" ON business_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Only admins can manage business metrics
CREATE POLICY "Admins can manage business metrics" ON business_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );