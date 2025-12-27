-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE availability_enum AS ENUM (
  'in_stock',
  'limited',
  'out_of_stock',
  'on_order'
);

CREATE TYPE urgency_enum AS ENUM (
  'immediate', 
  '1-2_weeks', 
  'planning'
);

CREATE TYPE device_enum AS ENUM (
  'mobile', 
  'tablet', 
  'desktop'
);

CREATE TYPE lead_status_enum AS ENUM (
  'new', 
  'contacted', 
  'qualified', 
  'converted', 
  'closed'
);

CREATE TYPE admin_role_enum AS ENUM (
  'admin', 
  'manager'
);

-- Product Categories Table
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability Status Table
CREATE TABLE availability_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  status availability_enum NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  admin_override BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Leads Table
CREATE TABLE enhanced_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  product_category UUID REFERENCES product_categories(id),
  urgency urgency_enum NOT NULL,
  quantity_estimate VARCHAR(255),
  message TEXT,
  source_section VARCHAR(100),
  device_type device_enum,
  user_agent TEXT,
  referrer VARCHAR(500),
  ip_address INET,
  status lead_status_enum DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Profiles Table
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role_enum DEFAULT 'manager',
  full_name VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_availability_status_category_id ON availability_status(category_id);
CREATE INDEX idx_availability_status_last_updated ON availability_status(last_updated);
CREATE INDEX idx_enhanced_leads_created_at ON enhanced_leads(created_at);
CREATE INDEX idx_enhanced_leads_status ON enhanced_leads(status);
CREATE INDEX idx_enhanced_leads_product_category ON enhanced_leads(product_category);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_resource_type ON audit_log(resource_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_product_categories_updated_at 
  BEFORE UPDATE ON product_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhanced_leads_updated_at 
  BEFORE UPDATE ON enhanced_leads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();