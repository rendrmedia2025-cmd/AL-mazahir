-- Testimonials Table Migration
-- For admin-controlled testimonial management

-- Create testimonials table
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  image_url VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create performance indexes
CREATE INDEX idx_testimonials_is_active ON testimonials(is_active);
CREATE INDEX idx_testimonials_display_order ON testimonials(display_order);
CREATE INDEX idx_testimonials_rating ON testimonials(rating);
CREATE INDEX idx_testimonials_created_at ON testimonials(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_testimonials_updated_at 
  BEFORE UPDATE ON testimonials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Public read access for active testimonials
CREATE POLICY "Public can view active testimonials" ON testimonials
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage testimonials" ON testimonials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Insert some default testimonials
INSERT INTO testimonials (name, company, position, content, rating, display_order, is_active) VALUES
(
  'Ahmed Al-Rashid',
  'Saudi Construction Co.',
  'Safety Manager',
  'Al Mazahir Trading has been our trusted partner for industrial safety equipment for over 5 years. Their commitment to quality and timely delivery has been exceptional.',
  5,
  1,
  true
),
(
  'Fatima Al-Zahra',
  'Gulf Manufacturing Ltd.',
  'Procurement Director',
  'The comprehensive range of safety solutions and professional service from Al Mazahir has significantly improved our workplace safety standards.',
  5,
  2,
  true
),
(
  'Mohammed Al-Otaibi',
  'Riyadh Infrastructure Projects',
  'Project Manager',
  'Outstanding service and high-quality industrial equipment. Al Mazahir understands the unique requirements of large-scale infrastructure projects.',
  5,
  3,
  true
),
(
  'Sarah Al-Mansouri',
  'Petrochemical Industries Corp.',
  'HSE Director',
  'Their expertise in oil & gas safety equipment is unmatched. Al Mazahir consistently delivers solutions that meet the highest industry standards.',
  5,
  4,
  false
),
(
  'Khalid Al-Dosari',
  'National Mining Company',
  'Operations Manager',
  'Reliable partner for heavy-duty mining equipment and safety gear. Their understanding of harsh working conditions is impressive.',
  5,
  5,
  false
);