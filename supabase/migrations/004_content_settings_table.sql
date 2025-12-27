-- Create content_settings table for managing website content
CREATE TABLE IF NOT EXISTS content_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_settings_key ON content_settings(key);

-- Insert default content settings
INSERT INTO content_settings (key, value, description) VALUES
(
  'contact_info',
  '{
    "phone": "+966 11 234 5678",
    "whatsapp": "+966 50 123 4567",
    "email": "info@almazahir.com",
    "address": "Industrial District, Riyadh, Saudi Arabia"
  }',
  'Contact information displayed on the website'
),
(
  'hero_text',
  '{
    "title": "Industrial Excellence in Saudi Arabia",
    "subtitle": "Your trusted partner for construction materials, safety equipment, and industrial supplies",
    "cta_text": "Get Quote"
  }',
  'Hero section text and call-to-action'
),
(
  'cta_labels',
  '{
    "in_stock": "Request Quote",
    "limited": "Check Availability", 
    "out_of_stock": "Notify Me",
    "on_order": "Request Lead Time",
    "default": "Enquire Now"
  }',
  'Call-to-action button labels for different availability states'
)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE content_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view content settings" ON content_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admin users can update content settings" ON content_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() 
      AND is_active = true
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_settings_updated_at
  BEFORE UPDATE ON content_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_content_settings_updated_at();