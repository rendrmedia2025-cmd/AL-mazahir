'use client'

import { useState } from 'react'
import Image from 'next/image'

const categories = [
  {
    id: 'safety-equipment',
    name: 'Safety Equipment',
    description: 'Professional safety gear and protective equipment for industrial applications',
    icon: '🦺',
    color: 'bg-red-500',
    products: [
      { name: 'Safety Helmets', price: 'SAR 45-120', image: '/images/products/safety-helmet.jpg', features: ['ANSI Certified', 'Adjustable Fit', 'Impact Resistant'] },
      { name: 'Safety Glasses', price: 'SAR 25-80', image: '/images/products/safety-glasses.jpg', features: ['UV Protection', 'Anti-Fog', 'Scratch Resistant'] },
      { name: 'Work Gloves', price: 'SAR 15-60', image: '/images/products/work-gloves.jpg', features: ['Cut Resistant', 'Grip Enhanced', 'Breathable'] },
      { name: 'Safety Boots', price: 'SAR 120-300', image: '/images/products/safety-boots.jpg', features: ['Steel Toe', 'Slip Resistant', 'Waterproof'] }
    ]
  },
  {
    id: 'construction-materials',
    name: 'Construction Materials',
    description: 'High-quality construction and building materials for all project needs',
    icon: '🏗️',
    color: 'bg-orange-500',
    products: [
      { name: 'Portland Cement', price: 'SAR 18-25/bag', image: '/images/products/cement.jpg', features: ['Grade 42.5', 'High Strength', 'Fast Setting'] },
      { name: 'Steel Rebar', price: 'SAR 2,200-2,800/ton', image: '/images/products/steel-rebar.jpg', features: ['Grade 60', 'Corrosion Resistant', 'Various Sizes'] },
      { name: 'Concrete Blocks', price: 'SAR 3-8/block', image: '/images/products/concrete-blocks.jpg', features: ['Hollow Core', 'Standard Sizes', 'High Density'] },
      { name: 'Scaffolding', price: 'SAR 15-35/m²', image: '/images/products/scaffolding.jpg', features: ['Aluminum Frame', 'Quick Assembly', 'Safety Certified'] }
    ]
  },
  {
    id: 'tools-machinery',
    name: 'Tools & Machinery',
    description: 'Professional tools and heavy machinery for industrial operations',
    icon: '🔧',
    color: 'bg-blue-500',
    products: [
      { name: 'Power Drills', price: 'SAR 180-450', image: '/images/products/power-drill.jpg', features: ['Cordless', 'Variable Speed', 'LED Light'] },
      { name: 'Angle Grinders', price: 'SAR 120-380', image: '/images/products/angle-grinder.jpg', features: ['High Power', 'Safety Guard', 'Ergonomic Design'] },
      { name: 'Welding Machines', price: 'SAR 800-2,500', image: '/images/products/welding-machine.jpg', features: ['MIG/TIG/Stick', 'Digital Display', 'Portable'] },
      { name: 'Compressors', price: 'SAR 600-1,800', image: '/images/products/compressor.jpg', features: ['Oil-Free', 'Quiet Operation', 'Auto Shut-off'] }
    ]
  },
  {
    id: 'industrial-supplies',
    name: 'Industrial Supplies',
    description: 'Comprehensive industrial materials, chemicals, and consumables',
    icon: '⚙️',
    color: 'bg-green-500',
    products: [
      { name: 'Industrial Adhesives', price: 'SAR 35-150', image: '/images/products/industrial-adhesive.jpg', features: ['High Bond Strength', 'Temperature Resistant', 'Fast Cure'] },
      { name: 'Lubricants', price: 'SAR 45-200', image: '/images/products/lubricant.jpg', features: ['Multi-Grade', 'Synthetic Blend', 'Extended Life'] },
      { name: 'Fasteners', price: 'SAR 0.50-15/piece', image: '/images/products/fasteners.jpg', features: ['Stainless Steel', 'Various Sizes', 'Corrosion Resistant'] },
      { name: 'Chemicals', price: 'SAR 25-300', image: '/images/products/chemicals.jpg', features: ['Industrial Grade', 'Safety Certified', 'Bulk Available'] }
    ]
  },
  {
    id: 'fire-safety',
    name: 'Fire Safety',
    description: 'Complete fire prevention and safety equipment solutions',
    icon: '🚨',
    color: 'bg-red-600',
    products: [
      { name: 'Fire Extinguishers', price: 'SAR 85-350', image: '/images/products/fire-extinguisher.jpg', features: ['ABC Type', 'Rechargeable', 'Wall Mount'] },
      { name: 'Smoke Detectors', price: 'SAR 65-180', image: '/images/products/smoke-detector.jpg', features: ['Photoelectric', 'Battery Backup', 'Test Button'] },
      { name: 'Emergency Lights', price: 'SAR 120-400', image: '/images/products/emergency-light.jpg', features: ['LED Technology', '3-Hour Backup', 'Self-Test'] },
      { name: 'Fire Blankets', price: 'SAR 45-120', image: '/images/products/fire-blanket.jpg', features: ['Fiberglass', 'Quick Release', 'Compact Storage'] }
    ]
  },
  {
    id: 'rental-equipment',
    name: 'Equipment Rental',
    description: 'Heavy equipment rental and logistics services with flexible terms',
    icon: '🚛',
    color: 'bg-purple-500',
    products: [
      { name: 'Forklifts', price: 'SAR 200-500/day', image: '/images/products/forklift.jpg', features: ['Electric/Diesel', 'Various Capacities', 'Operator Training'] },
      { name: 'Mobile Cranes', price: 'SAR 800-2,000/day', image: '/images/products/crane.jpg', features: ['Hydraulic', 'Certified Operators', 'Transport Included'] },
      { name: 'Generators', price: 'SAR 150-600/day', image: '/images/products/generator.jpg', features: ['Diesel/Gas', 'Silent Operation', 'Auto Start'] },
      { name: 'Excavators', price: 'SAR 400-1,200/day', image: '/images/products/excavator.jpg', features: ['Mini to Large', 'Attachments Available', 'Delivery Service'] }
    ]
  }
]

export default function ProductCatalog() {
  const [activeCategory, setActiveCategory] = useState('safety-equipment')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const currentCategory = categories.find(cat => cat.id === activeCategory)

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Our Product Categories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive industrial solutions with over 10,000 products in stock. 
            Quality guaranteed, competitive pricing, and fast delivery across the GCC.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeCategory === category.id
                  ? `${category.color} text-white shadow-lg transform scale-105`
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
              }`}
            >
              <span className="text-2xl">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Active Category Content */}
        {currentCategory && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Category Header */}
            <div className={`${currentCategory.color} text-white p-8`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-2">{currentCategory.name}</h3>
                  <p className="text-lg opacity-90">{currentCategory.description}</p>
                </div>
                <div className="text-6xl opacity-20">
                  {currentCategory.icon}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentCategory.products.map((product, index) => (
                  <div
                    key={index}
                    className="group bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Product Image Placeholder */}
                    <div className="h-40 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-4xl text-gray-400 group-hover:bg-gray-300 transition-colors">
                      {currentCategory.icon}
                    </div>

                    {/* Product Info */}
                    <h4 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-2xl font-bold text-blue-600 mb-3">
                      {product.price}
                    </p>

                    {/* Features */}
                    <ul className="space-y-1 text-sm text-gray-600">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Get Quote
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Features */}
            <div className="bg-gray-50 p-8 border-t">
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 text-xl">✓</span>
                  </div>
                  <h4 className="font-semibold mb-1">Quality Assured</h4>
                  <p className="text-sm text-gray-600">ISO certified products</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 text-xl">🚚</span>
                  </div>
                  <h4 className="font-semibold mb-1">Fast Delivery</h4>
                  <p className="text-sm text-gray-600">Same day in Riyadh</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-orange-600 text-xl">💰</span>
                  </div>
                  <h4 className="font-semibold mb-1">Best Prices</h4>
                  <p className="text-sm text-gray-600">Competitive rates</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 text-xl">🛠️</span>
                  </div>
                  <h4 className="font-semibold mb-1">Expert Support</h4>
                  <p className="text-sm text-gray-600">Technical assistance</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}