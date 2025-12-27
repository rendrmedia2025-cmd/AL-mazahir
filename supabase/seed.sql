-- Insert initial product categories based on the existing website structure
INSERT INTO product_categories (name, slug, description, display_order, is_active) VALUES
  ('Construction Materials', 'construction-materials', 'High-quality construction materials including cement, steel, and building supplies', 1, true),
  ('Safety Equipment', 'safety-equipment', 'Comprehensive safety gear and protective equipment for industrial environments', 2, true),
  ('Tools & Machinery', 'tools-machinery', 'Professional tools and heavy machinery for construction and industrial use', 3, true),
  ('Fire Safety', 'fire-safety', 'Fire prevention and safety equipment including extinguishers and detection systems', 4, true),
  ('Industrial Supplies', 'industrial-supplies', 'General industrial supplies including lubricants, adhesives, and fasteners', 5, true),
  ('Rental & Logistics', 'rental-logistics', 'Equipment rental services and logistics solutions', 6, true);

-- Insert initial availability status for all categories (default to in_stock)
INSERT INTO availability_status (category_id, status, notes)
SELECT 
  id, 
  'in_stock'::availability_enum, 
  'Initial setup - all categories available'
FROM product_categories;

-- Note: Admin users will be created through the Supabase Auth UI
-- The admin_profiles will be populated when users first log in through a trigger or manual process