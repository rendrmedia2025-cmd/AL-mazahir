'use client'

import { useState, useEffect } from 'react'

interface FormData {
  name: string
  email: string
  phone: string
  company: string
  industry: string
  projectType: string
  budget: string
  timeline: string
  message: string
  source: string
}

interface BehavioralData {
  timeOnPage: number
  scrollDepth: number
  pagesVisited: number
  categoryInterest: string[]
}

export default function EnhancedLeadCaptureForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    projectType: '',
    budget: '',
    timeline: '',
    message: '',
    source: 'website'
  })

  const [behavioralData, setBehavioralData] = useState<BehavioralData>({
    timeOnPage: 0,
    scrollDepth: 0,
    pagesVisited: 1,
    categoryInterest: []
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Track behavioral analytics
  useEffect(() => {
    const startTime = Date.now()
    let maxScroll = 0

    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      )
      maxScroll = Math.max(maxScroll, scrollPercent)
      setBehavioralData(prev => ({ ...prev, scrollDepth: maxScroll }))
    }

    const trackTime = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      setBehavioralData(prev => ({ ...prev, timeOnPage: timeSpent }))
    }

    window.addEventListener('scroll', trackScroll)
    const timeInterval = setInterval(trackTime, 1000)

    return () => {
      window.removeEventListener('scroll', trackScroll)
      clearInterval(timeInterval)
    }
  }, [])

  const industries = [
    'Construction', 'Manufacturing', 'Oil & Gas', 'Mining', 'Transportation',
    'Utilities', 'Healthcare', 'Education', 'Government', 'Other'
  ]

  const projectTypes = [
    'Safety Equipment Purchase', 'Construction Project', 'Equipment Rental',
    'Maintenance Services', 'Bulk Supply Contract', 'Technical Consultation', 'Other'
  ]

  const budgetRanges = [
    'Under SAR 10,000', 'SAR 10,000 - 50,000', 'SAR 50,000 - 100,000',
    'SAR 100,000 - 500,000', 'SAR 500,000 - 1,000,000', 'Over SAR 1,000,000'
  ]

  const timelines = [
    'Immediate (Within 1 week)', 'Short-term (1-4 weeks)', 'Medium-term (1-3 months)',
    'Long-term (3-6 months)', 'Planning phase (6+ months)'
  ]

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateLeadScore = () => {
    let score = 0
    
    // Company size indicator
    if (formData.company) score += 10
    
    // Budget scoring
    const budgetScores: { [key: string]: number } = {
      'Under SAR 10,000': 5,
      'SAR 10,000 - 50,000': 15,
      'SAR 50,000 - 100,000': 25,
      'SAR 100,000 - 500,000': 35,
      'SAR 500,000 - 1,000,000': 45,
      'Over SAR 1,000,000': 50
    }
    score += budgetScores[formData.budget] || 0
    
    // Timeline urgency
    const timelineScores: { [key: string]: number } = {
      'Immediate (Within 1 week)': 30,
      'Short-term (1-4 weeks)': 25,
      'Medium-term (1-3 months)': 20,
      'Long-term (3-6 months)': 15,
      'Planning phase (6+ months)': 10
    }
    score += timelineScores[formData.timeline] || 0
    
    // Behavioral scoring
    if (behavioralData.timeOnPage > 120) score += 10 // 2+ minutes
    if (behavioralData.scrollDepth > 75) score += 10 // 75%+ scroll
    if (behavioralData.categoryInterest.length > 2) score += 10 // Multiple interests
    
    return Math.min(score, 100) // Cap at 100
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const leadScore = calculateLeadScore()
      
      const submissionData = {
        ...formData,
        behavioralData,
        leadScore,
        submittedAt: new Date().toISOString()
      }

      const response = await fetch('/api/leads/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      })

      if (response.ok) {
        setSubmitStatus('success')
        
        // Generate WhatsApp message
        const whatsappMessage = `New Lead from Al Mazahir Website:

👤 Contact: ${formData.name}
🏢 Company: ${formData.company}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}

🏭 Industry: ${formData.industry}
📋 Project: ${formData.projectType}
💰 Budget: ${formData.budget}
⏰ Timeline: ${formData.timeline}

📊 Lead Score: ${leadScore}/100
⏱️ Time on site: ${Math.floor(behavioralData.timeOnPage / 60)}m ${behavioralData.timeOnPage % 60}s
📜 Scroll depth: ${behavioralData.scrollDepth}%

💬 Message: ${formData.message}

Generated automatically from almazahir.sa`

        const whatsappUrl = `https://wa.me/966XXXXXXXXX?text=${encodeURIComponent(whatsappMessage)}`
        window.open(whatsappUrl, '_blank')
        
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  if (submitStatus === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-2xl">✓</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h3>
        <p className="text-gray-600 mb-6">
          Your inquiry has been received. Our team will contact you within 2 hours during business hours.
        </p>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Lead Score:</strong> {calculateLeadScore()}/100 - 
            {calculateLeadScore() >= 70 ? ' High Priority' : 
             calculateLeadScore() >= 40 ? ' Medium Priority' : ' Standard Priority'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Your Custom Quote
            </h2>
            <p className="text-xl text-gray-600">
              Tell us about your project and we'll provide a tailored solution
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Progress Bar */}
            <div className="bg-gray-50 px-8 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Step {currentStep} of 3</span>
                <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your.email@company.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+966 XX XXX XXXX"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your company name"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Project Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Project Details</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry *
                      </label>
                      <select
                        required
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select your industry</option>
                        {industries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Type *
                      </label>
                      <select
                        required
                        value={formData.projectType}
                        onChange={(e) => handleInputChange('projectType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select project type</option>
                        {projectTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Range *
                      </label>
                      <select
                        required
                        value={formData.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select budget range</option>
                        {budgetRanges.map(range => (
                          <option key={range} value={range}>{range}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeline *
                      </label>
                      <select
                        required
                        value={formData.timeline}
                        onChange={(e) => handleInputChange('timeline', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select timeline</option>
                        {timelines.map(timeline => (
                          <option key={timeline} value={timeline}>{timeline}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Message & Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Additional Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Description
                    </label>
                    <textarea
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please describe your project requirements, specific products needed, or any questions you have..."
                    />
                  </div>

                  {/* Lead Score Preview */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-3">Your Inquiry Summary</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><strong>Industry:</strong> {formData.industry || 'Not specified'}</div>
                      <div><strong>Project:</strong> {formData.projectType || 'Not specified'}</div>
                      <div><strong>Budget:</strong> {formData.budget || 'Not specified'}</div>
                      <div><strong>Timeline:</strong> {formData.timeline || 'Not specified'}</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900">Priority Score:</span>
                        <span className="text-2xl font-bold text-blue-600">{calculateLeadScore()}/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}