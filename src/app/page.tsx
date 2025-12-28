'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

// Product categories data
const categories = [
  {
    id: 'safety-equipment',
    name: 'Safety Equipment',
    description: 'Professional safety gear and protective equipment',
    image: '/images/categories/safety-equipment.jpg',
    products: [
      { name: 'Safety Helmets', price: 'SAR 45-120', image: '/images/products/safety-helmet.jpg' },
      { name: 'Safety Glasses', price: 'SAR 25-80', image: '/images/products/safety-glasses.jpg' },
      { name: 'Work Gloves', price: 'SAR 15-60', image: '/images/products/work-gloves.jpg' }
    ]
  },
  {
    id: 'construction-materials',
    name: 'Construction Materials',
    description: 'High-quality construction and building materials',
    image: '/images/categories/construction-materials.jpg',
    products: [
      { name: 'Portland Cement', price: 'SAR 18-25/bag', image: '/images/products/cement.jpg' },
      { name: 'Steel Rebar', price: 'SAR 2,200-2,800/ton', image: '/images/products/steel-rebar.jpg' },
      { name: 'Concrete Blocks', price: 'SAR 3-8/block', image: '/images/products/concrete-blocks.jpg' }
    ]
  },
  {
    id: 'tools-machinery',
    name: 'Tools & Machinery',
    description: 'Industrial tools and heavy machinery',
    image: '/images/categories/tools-machinery.jpg',
    products: [
      { name: 'Power Drills', price: 'SAR 180-450', image: '/images/products/power-drill.jpg' },
      { name: 'Angle Grinders', price: 'SAR 120-380', image: '/images/products/angle-grinder.jpg' },
      { name: 'Welding Machines', price: 'SAR 800-2,500', image: '/images/products/welding-machine.jpg' }
    ]
  },
  {
    id: 'industrial-supplies',
    name: 'Industrial Supplies',
    description: 'Comprehensive industrial materials and chemicals',
    image: '/images/categories/industrial-supplies.jpg',
    products: [
      { name: 'Industrial Adhesives', price: 'SAR 35-150', image: '/images/products/industrial-adhesive.jpg' },
      { name: 'Lubricants', price: 'SAR 45-200', image: '/images/products/lubricant.jpg' },
      { name: 'Fasteners', price: 'SAR 0.50-15/piece', image: '/images/products/fasteners.jpg' }
    ]
  },
  {
    id: 'fire-safety',
    name: 'Fire Safety',
    description: 'Fire prevention and safety equipment',
    image: '/images/categories/fire-safety.jpg',
    products: [
      { name: 'Fire Extinguishers', price: 'SAR 85-350', image: '/images/products/fire-extinguisher.jpg' },
      { name: 'Smoke Detectors', price: 'SAR 65-180', image: '/images/products/smoke-detector.jpg' },
      { name: 'Emergency Lights', price: 'SAR 120-400', image: '/images/products/emergency-light.jpg' }
    ]
  },
  {
    id: 'rental-logistics',
    name: 'Equipment Rental',
    description: 'Heavy equipment rental and logistics services',
    image: '/images/categories/rental-logistics.jpg',
    products: [
      { name: 'Forklifts', price: 'SAR 200-500/day', image: '/images/products/forklift.jpg' },
      { name: 'Mobile Cranes', price: 'SAR 800-2,000/day', image: '/images/products/crane.jpg' },
      { name: 'Scaffolding', price: 'SAR 15-35/m²/month', image: '/images/products/scaffolding.jpg' }
    ]
  }
]

// Testimonials data
const testimonials = [
  {
    name: 'Ahmed Al-Rashid',
    company: 'Saudi Construction Co.',
    text: 'Al Mazahir has been our trusted partner for over 5 years. Their quality and service are unmatched.',
    rating: 5
  },
  {
    name: 'Fatima Al-Zahra',
    company: 'Gulf Industrial Solutions',
    text: 'Excellent product range and competitive prices. Always deliver on time.',
    rating: 5
  },
  {
    name: 'Mohammed Al-Otaibi',
    company: 'Riyadh Safety Systems',
    text: 'Professional team with deep industry knowledge. Highly recommended.',
    rating: 5
  }
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('safety-equipment')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  })

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Generate WhatsApp message
    const message = `Hello Al Mazahir Trading,

Name: ${formData.name}
Company: ${formData.company}
Email: ${formData.email}
Phone: ${formData.phone}

Message: ${formData.message}

I'm interested in your industrial solutions.`

    const whatsappUrl = `https://wa.me/966XXXXXXXXX?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">AM</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Al Mazahir Trading Est.</h1>
                <p className="text-sm text-gray-600">Industrial Solutions Since 2010</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <span className="text-sm text-gray-600">📞 +966 XX XXX XXXX</span>
              <span className="text-sm text-gray-600">📧 info@almazahir.sa</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Your Trusted Industrial Partner
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Leading provider of industrial safety equipment, construction materials, and logistics solutions 
            across Saudi Arabia and the GCC region. Serving industries with excellence since 2010.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              View Products
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Get Quote
            </button>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Our Product Categories</h3>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Active Category Display */}
          {categories.map((category) => (
            activeCategory === category.id && (
              <div key={category.id} className="bg-white rounded-lg shadow-lg p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
                  <div>
                    <h4 className="text-2xl font-bold mb-4">{category.name}</h4>
                    <p className="text-gray-600 mb-6">{category.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-green-600">
                        <span className="mr-2">✓</span>
                        <span>High Quality Standards</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <span className="mr-2">✓</span>
                        <span>Competitive Pricing</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <span className="mr-2">✓</span>
                        <span>Fast Delivery</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      {category.name} Image
                    </div>
                  </div>
                </div>

                {/* Featured Products */}
                <div className="grid md:grid-cols-3 gap-6">
                  {category.products.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="h-32 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-500">
                        {product.name}
                      </div>
                      <h5 className="font-semibold mb-2">{product.name}</h5>
                      <p className="text-blue-600 font-bold">{product.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose Al Mazahir?</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">15+</span>
              </div>
              <h4 className="font-semibold mb-2">Years Experience</h4>
              <p className="text-gray-600">Serving industries since 2010</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">500+</span>
              </div>
              <h4 className="font-semibold mb-2">Happy Clients</h4>
              <p className="text-gray-600">Trusted by major companies</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">24/7</span>
              </div>
              <h4 className="font-semibold mb-2">Support</h4>
              <p className="text-gray-600">Round-the-clock assistance</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">GCC</span>
              </div>
              <h4 className="font-semibold mb-2">Wide Coverage</h4>
              <p className="text-gray-600">Serving across GCC region</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">What Our Clients Say</h3>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>
              <p className="text-lg text-gray-700 mb-6 italic">
                "{testimonials[currentTestimonial].text}"
              </p>
              <div>
                <h4 className="font-semibold">{testimonials[currentTestimonial].name}</h4>
                <p className="text-gray-600">{testimonials[currentTestimonial].company}</p>
              </div>
            </div>
            
            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full ${
                    currentTestimonial === index ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">Get In Touch</h3>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-xl font-semibold mb-6">Contact Information</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">📍</span>
                    <span>Riyadh, Saudi Arabia</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">📞</span>
                    <span>+966 XX XXX XXXX</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">📧</span>
                    <span>info@almazahir.sa</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-3">🕒</span>
                    <span>Sun-Thu: 8:00 AM - 6:00 PM</span>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Send via WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4">Al Mazahir Trading Est.</h4>
              <p className="text-gray-400 mb-4">
                Your trusted partner for industrial solutions across Saudi Arabia and the GCC region.
              </p>
              <div className="flex space-x-4">
                <span className="text-2xl">📱</span>
                <span className="text-2xl">📧</span>
                <span className="text-2xl">🌐</span>
              </div>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Products</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Safety Equipment</li>
                <li>Construction Materials</li>
                <li>Tools & Machinery</li>
                <li>Industrial Supplies</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Services</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Equipment Rental</li>
                <li>Logistics Solutions</li>
                <li>Technical Support</li>
                <li>Consultation</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Contact</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Riyadh, Saudi Arabia</li>
                <li>+966 XX XXX XXXX</li>
                <li>info@almazahir.sa</li>
                <li>www.almazahir.sa</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Al Mazahir Trading Est. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}