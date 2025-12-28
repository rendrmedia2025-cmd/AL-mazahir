'use client'

import { useState } from 'react'

export default function AboutSection() {
  const [activeTab, setActiveTab] = useState('company')

  const tabs = [
    { id: 'company', label: 'Our Company', icon: '🏢' },
    { id: 'mission', label: 'Mission & Vision', icon: '🎯' },
    { id: 'certifications', label: 'Certifications', icon: '🏆' },
    { id: 'team', label: 'Our Team', icon: '👥' }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            About Al Mazahir Trading Est.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Leading the industrial supply chain across Saudi Arabia and the GCC region 
            with over 15 years of excellence and innovation.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'company' && (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Established Excellence Since 2010
                </h3>
                <div className="space-y-4 text-gray-700">
                  <p className="text-lg">
                    Al Mazahir Trading Est. was founded with a vision to become the premier 
                    industrial supplier in the Kingdom of Saudi Arabia. What started as a 
                    small trading company has grown into a comprehensive industrial solutions provider.
                  </p>
                  <p>
                    We specialize in safety equipment, construction materials, industrial tools, 
                    and equipment rental services. Our commitment to quality, competitive pricing, 
                    and exceptional customer service has earned us the trust of over 500 companies 
                    across the GCC region.
                  </p>
                  <p>
                    From major construction projects to small industrial operations, we provide 
                    tailored solutions that meet the unique needs of each client while maintaining 
                    the highest standards of safety and quality.
                  </p>
                </div>
                
                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-6 mt-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">15+</div>
                    <div className="text-sm text-gray-600">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">500+</div>
                    <div className="text-sm text-gray-600">Active Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">10K+</div>
                    <div className="text-sm text-gray-600">Products</div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8">
                  <div className="text-center text-6xl mb-4">🏭</div>
                  <h4 className="text-xl font-semibold text-center mb-4">Our Facilities</h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      15,000 sqm warehouse facility in Riyadh
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Modern inventory management systems
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Quality control and testing laboratories
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      24/7 logistics and distribution center
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mission' && (
            <div className="text-center max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12">
                <div className="bg-blue-50 rounded-2xl p-8">
                  <div className="text-5xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold text-blue-900 mb-4">Our Mission</h3>
                  <p className="text-gray-700">
                    To provide comprehensive industrial solutions that enhance safety, 
                    productivity, and efficiency for businesses across the GCC region. 
                    We are committed to delivering exceptional quality products and services 
                    while building long-term partnerships with our clients.
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-2xl p-8">
                  <div className="text-5xl mb-4">🌟</div>
                  <h3 className="text-2xl font-bold text-green-900 mb-4">Our Vision</h3>
                  <p className="text-gray-700">
                    To be the leading industrial supplier in the Middle East, recognized 
                    for innovation, reliability, and excellence. We envision a future where 
                    every industrial operation operates safely and efficiently with our solutions.
                  </p>
                </div>
              </div>
              
              {/* Core Values */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Our Core Values</h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-red-600 text-2xl">🛡️</span>
                    </div>
                    <h4 className="font-semibold mb-2">Safety First</h4>
                    <p className="text-sm text-gray-600">Prioritizing safety in every product and service</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-blue-600 text-2xl">⭐</span>
                    </div>
                    <h4 className="font-semibold mb-2">Quality Excellence</h4>
                    <p className="text-sm text-gray-600">Maintaining highest quality standards</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-green-600 text-2xl">🤝</span>
                    </div>
                    <h4 className="font-semibold mb-2">Customer Focus</h4>
                    <p className="text-sm text-gray-600">Building lasting client relationships</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-purple-600 text-2xl">🚀</span>
                    </div>
                    <h4 className="font-semibold mb-2">Innovation</h4>
                    <p className="text-sm text-gray-600">Embracing new technologies and solutions</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'certifications' && (
            <div>
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Certified Excellence & Compliance
                </h3>
                <p className="text-lg text-gray-600">
                  Our certifications demonstrate our commitment to quality, safety, and international standards
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">🏆</div>
                  <h4 className="text-xl font-bold text-blue-900 mb-2">ISO 9001:2015</h4>
                  <p className="text-blue-700 mb-4">Quality Management System</p>
                  <div className="text-sm text-blue-600">
                    <p>Certified: March 2022</p>
                    <p>Valid until: March 2025</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">🛡️</div>
                  <h4 className="text-xl font-bold text-green-900 mb-2">OHSAS 18001</h4>
                  <p className="text-green-700 mb-4">Occupational Health & Safety</p>
                  <div className="text-sm text-green-600">
                    <p>Certified: June 2022</p>
                    <p>Valid until: June 2025</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">🌍</div>
                  <h4 className="text-xl font-bold text-purple-900 mb-2">ISO 14001:2015</h4>
                  <p className="text-purple-700 mb-4">Environmental Management</p>
                  <div className="text-sm text-purple-600">
                    <p>Certified: September 2022</p>
                    <p>Valid until: September 2025</p>
                  </div>
                </div>
              </div>
              
              {/* Additional Certifications */}
              <div className="mt-12 bg-gray-50 rounded-xl p-8">
                <h4 className="text-xl font-bold text-gray-900 mb-6 text-center">
                  Additional Certifications & Memberships
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                      <span>Saudi Standards, Metrology and Quality Organization (SASO)</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                      <span>General Organization for Technical Education (GOTEVT)</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                      <span>Riyadh Chamber of Commerce Member</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                      <span>GCC Industrial Safety Association</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                      <span>International Safety Equipment Association (ISEA)</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                      <span>Construction Industry Development Board</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div>
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Meet Our Expert Team
                </h3>
                <p className="text-lg text-gray-600">
                  Experienced professionals dedicated to delivering exceptional industrial solutions
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 text-2xl font-bold">AH</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Ahmed Hassan</h4>
                  <p className="text-blue-600 font-medium mb-3">Managing Director</p>
                  <p className="text-gray-600 text-sm mb-4">
                    15+ years in industrial supply chain management. Expert in safety regulations and quality assurance.
                  </p>
                  <div className="flex justify-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Leadership</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Strategy</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 text-2xl font-bold">SA</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Sarah Al-Rashid</h4>
                  <p className="text-green-600 font-medium mb-3">Operations Manager</p>
                  <p className="text-gray-600 text-sm mb-4">
                    12+ years in logistics and supply chain optimization. Specialist in inventory management systems.
                  </p>
                  <div className="flex justify-center space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Operations</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Logistics</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-purple-600 text-2xl font-bold">MK</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Mohammed Khalil</h4>
                  <p className="text-purple-600 font-medium mb-3">Technical Director</p>
                  <p className="text-gray-600 text-sm mb-4">
                    18+ years in industrial engineering. Expert in safety equipment and technical consultation.
                  </p>
                  <div className="flex justify-center space-x-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Engineering</span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Safety</span>
                  </div>
                </div>
              </div>
              
              {/* Team Stats */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
                <h4 className="text-2xl font-bold mb-6">Our Team by Numbers</h4>
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-3xl font-bold">45+</div>
                    <div className="text-blue-100">Team Members</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">8</div>
                    <div className="text-blue-100">Departments</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">25+</div>
                    <div className="text-blue-100">Certifications</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">12</div>
                    <div className="text-blue-100">Languages</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}