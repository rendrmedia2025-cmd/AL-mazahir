const fs = require('fs');
const path = require('path');

// Create placeholder SVG function
function createPlaceholderSVG(width, height, text, bgColor = '#334155', textColor = '#ffffff') {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="${textColor}" text-anchor="middle" dy=".3em">${text}</text>
</svg>`;
}

// Category images
const categories = [
  'safety-equipment',
  'fire-safety', 
  'construction-materials',
  'tools-machinery',
  'industrial-supplies',
  'rental-logistics'
];

// Product images
const products = [
  'safety-helmet', 'safety-glasses', 'work-gloves',
  'fire-extinguisher', 'smoke-detector', 'emergency-light',
  'cement', 'steel-rebar', 'concrete-blocks',
  'power-drill', 'angle-grinder', 'welding-machine',
  'industrial-adhesive', 'lubricant', 'fasteners',
  'forklift', 'crane', 'scaffolding'
];

// Create category placeholders
categories.forEach(category => {
  const svg = createPlaceholderSVG(400, 300, category.replace('-', ' ').toUpperCase(), '#dc2626');
  fs.writeFileSync(`public/images/categories/${category}.jpg`, svg);
});

// Create product placeholders  
products.forEach(product => {
  const svg = createPlaceholderSVG(200, 150, product.replace('-', ' ').toUpperCase(), '#475569');
  fs.writeFileSync(`public/images/products/${product}.jpg`, svg);
});

console.log('Placeholder images created successfully!');