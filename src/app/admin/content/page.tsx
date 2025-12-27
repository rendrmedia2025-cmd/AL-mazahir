'use client'

import { useEffect, useState } from 'react'
import { authClient, type AuthSession } from '@/lib/auth-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ContentSettings {
  id: string
  key: string
  value: any
  description?: string
  updated_at: string
}

interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  is_active: boolean
  display_order: number
}

interface ContactInfo {
  phone: string
  whatsapp: string
  email: string
  address: string
}

interface HeroText {
  title: string
  subtitle: string
  cta_text: string
}

interface CTALabels {
  in_stock: string
  limited: string
  out_of_stock: string
  on_order: string
  default: string
}

export default function ContentManagementPage() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [contentSettings, setContentSettings] = useState<ContentSettings[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'contact' | 'hero' | 'cta' | 'categories'>('contact')

  // Form states
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '',
    whatsapp: '',
    email: '',
    address: ''
  })
  const [heroText, setHeroText] = useState<HeroText>({
    title: '',
    subtitle: '',
    cta_text: ''
  })
  const [ctaLabels, setCTALabels] = useState<CTALabels>({
    in_stock: '',
    limited: '',
    out_of_stock: '',
    on_order: '',
    default: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionData = await authClient.getAuthSession()
        setSession(sessionData)

        if (sessionData) {
          await loadContentData()
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const loadContentData = async () => {
    try {
      const response = await fetch('/api/admin/content')
      if (response.ok) {
        const result = await response.json()
        setContentSettings(result.data.contentSettings || [])
        setCategories(result.data.categories || [])

        // Populate form states
        result.data.contentSettings.forEach((setting: ContentSettings) => {
          switch (setting.key) {
            case 'contact_info':
              setContactInfo(setting.value)
              break
            case 'hero_text':
              setHeroText(setting.value)
              break
            case 'cta_labels':
              setCTALabels(setting.value)
              break
          }
        })
      }
    } catch (error) {
      console.error('Failed to load content data:', error)
    }
  }

  const updateContent = async (type: string, data: any) => {
    setIsUpdating(type)
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data }),
      })

      if (response.ok) {
        await loadContentData()
        alert('Content updated successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to update content: ${error.error}`)
      }
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update content')
    } finally {
      setIsUpdating(null)
    }
  }

  const updateCategoryStatus = async (categoryId: string, isActive: boolean) => {
    setIsUpdating(`category-${categoryId}`)
    try {
      await updateContent('category_settings', { categoryId, is_active: isActive })
    } finally {
      setIsUpdating(null)
    }
  }

  const tabs = [
    { id: 'contact', label: 'Contact Info', icon: '📞' },
    { id: 'hero', label: 'Hero Section', icon: '🏠' },
    { id: 'cta', label: 'CTA Labels', icon: '🔘' },
    { id: 'categories', label: 'Categories', icon: '📦' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Please log in to manage website content.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Content Management
        </h1>
        <p className="text-gray-600">
          Update website content, contact information, and category settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contact Information Tab */}
      {activeTab === 'contact' && (
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+966 11 234 5678"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={contactInfo.whatsapp}
                onChange={(e) => setContactInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+966 50 123 4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="info@almazahir.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={contactInfo.address}
                onChange={(e) => setContactInfo(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Industrial District, Riyadh, Saudi Arabia"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              onClick={() => updateContent('contact_info', contactInfo)}
              disabled={isUpdating === 'contact_info'}
            >
              {isUpdating === 'contact_info' ? 'Updating...' : 'Update Contact Info'}
            </Button>
          </div>
        </Card>
      )}

      {/* Hero Section Tab */}
      {activeTab === 'hero' && (
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Hero Section</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Title
              </label>
              <input
                type="text"
                value={heroText.title}
                onChange={(e) => setHeroText(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Industrial Excellence in Saudi Arabia"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <textarea
                value={heroText.subtitle}
                onChange={(e) => setHeroText(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Your trusted partner for construction materials, safety equipment, and industrial supplies"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call-to-Action Button Text
              </label>
              <input
                type="text"
                value={heroText.cta_text}
                onChange={(e) => setHeroText(prev => ({ ...prev, cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Get Quote"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              onClick={() => updateContent('hero_text', heroText)}
              disabled={isUpdating === 'hero_text'}
            >
              {isUpdating === 'hero_text' ? 'Updating...' : 'Update Hero Section'}
            </Button>
          </div>
        </Card>
      )}

      {/* CTA Labels Tab */}
      {activeTab === 'cta' && (
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Call-to-Action Labels</h2>
          <p className="text-sm text-gray-600 mb-6">
            Customize the button text for different availability states.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                In Stock 🟢
              </label>
              <input
                type="text"
                value={ctaLabels.in_stock}
                onChange={(e) => setCTALabels(prev => ({ ...prev, in_stock: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Request Quote"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limited Stock 🟡
              </label>
              <input
                type="text"
                value={ctaLabels.limited}
                onChange={(e) => setCTALabels(prev => ({ ...prev, limited: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Check Availability"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Out of Stock 🔴
              </label>
              <input
                type="text"
                value={ctaLabels.out_of_stock}
                onChange={(e) => setCTALabels(prev => ({ ...prev, out_of_stock: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notify Me"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available on Order 🔵
              </label>
              <input
                type="text"
                value={ctaLabels.on_order}
                onChange={(e) => setCTALabels(prev => ({ ...prev, on_order: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Request Lead Time"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default (Fallback)
              </label>
              <input
                type="text"
                value={ctaLabels.default}
                onChange={(e) => setCTALabels(prev => ({ ...prev, default: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enquire Now"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              onClick={() => updateContent('cta_labels', ctaLabels)}
              disabled={isUpdating === 'cta_labels'}
            >
              {isUpdating === 'cta_labels' ? 'Updating...' : 'Update CTA Labels'}
            </Button>
          </div>
        </Card>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Product Categories</h2>
          <p className="text-sm text-gray-600 mb-6">
            Enable or disable product categories from being displayed on the website.
          </p>
          
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Display Order: {category.display_order}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.is_active ? 'Active' : 'Disabled'}
                  </span>
                  
                  <Button
                    onClick={() => updateCategoryStatus(category.id, !category.is_active)}
                    disabled={isUpdating === `category-${category.id}`}
                    variant={category.is_active ? 'outline' : 'default'}
                    size="sm"
                  >
                    {isUpdating === `category-${category.id}` 
                      ? 'Updating...' 
                      : category.is_active ? 'Disable' : 'Enable'
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">📦</p>
              <p>No product categories found.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}