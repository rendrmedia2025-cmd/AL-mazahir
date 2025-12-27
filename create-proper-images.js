const fs = require('fs');
const path = require('path');

// Create a proper CSS gradient background as SVG for hero
function createHeroBackground() {
  return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
    </linearGradient>
    <pattern id="industrialPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="url(#heroGradient)"/>
      <circle cx="50" cy="50" r="2" fill="#dc2626" opacity="0.1"/>
      <rect x="20" y="20" width="60" height="2" fill="#dc2626" opacity="0.05"/>
      <rect x="20" y="78" width="60" height="2" fill="#dc2626" opacity="0.05"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#industrialPattern)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle" dy=".3em" opacity="0.1">AL MAZAHIR TRADING</text>
</svg>`;
}

// Create category placeholder SVGs
function createCategoryImage(name, color = '#dc2626') {
  return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="categoryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:0.9" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#categoryGradient)"/>
  <rect x="20" y="20" width="360" height="260" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.3"/>
  <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">${name.replace('-', ' ').toUpperCase()}</text>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" opacity="0.8">Industrial Equipment</text>
</svg>`;
}

// Create product placeholder SVGs
function createProductImage(name, color = '#475569') {
  return `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="productGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#productGradient)"/>
  <circle cx="100" cy="75" r="30" fill="#dc2626" opacity="0.2"/>
  <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">${name.replace('-', ' ').toUpperCase()}</text>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="8" fill="#ffffff" text-anchor="middle" opacity="0.7">Professional Grade</text>
</svg>`;
}

// Ensure directories exist
const dirs = ['public/images', 'public/images/categories', 'public/images/products'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create hero background
fs.writeFileSync('public/images/hero-bg.svg', createHeroBackground());

// Category data
const categories = [
  { name: 'safety-equipment', color: '#dc2626' },
  { name: 'fire-safety', color: '#ea580c' },
  { name: 'construction-materials', color: '#d97706' },
  { name: 'tools-machinery', color: '#ca8a04' },
  { name: 'industrial-supplies', color: '#65a30d' },
  { name: 'rental-logistics', color: '#0891b2' }
];

// Product data
const products = [
  'safety-helmet', 'safety-glasses', 'work-gloves',
  'fire-extinguisher', 'smoke-detector', 'emergency-light',
  'cement', 'steel-rebar', 'concrete-blocks',
  'power-drill', 'angle-grinder', 'welding-machine',
  'industrial-adhesive', 'lubricant', 'fasteners',
  'forklift', 'crane', 'scaffolding'
];

// Create category images
categories.forEach(category => {
  const svg = createCategoryImage(category.name, category.color);
  fs.writeFileSync(`public/images/categories/${category.name}.svg`, svg);
});

// Create product images
products.forEach(product => {
  const svg = createProductImage(product);
  fs.writeFileSync(`public/images/products/${product}.svg`, svg);
});

console.log('✅ Proper SVG images created successfully!');
console.log('📁 Created:');
console.log('  - Hero background: public/images/hero-bg.svg');
console.log('  - Category images: 6 SVG files');
console.log('  - Product images: 18 SVG files');