'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Al Mazahir Trading</h1>
              <p className="text-xs text-gray-600">Industrial Solutions</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
            <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium">Products</Link>
            <Link href="/services" className="text-gray-700 hover:text-blue-600 font-medium">Services</Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">About</Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link>
          </nav>

          {/* Contact Info */}
          <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
            <span>📞 +966 XX XXX XXXX</span>
            <span>📧 info@almazahir.sa</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="py-2 text-gray-700 hover:text-blue-600">Home</Link>
              <Link href="/products" className="py-2 text-gray-700 hover:text-blue-600">Products</Link>
              <Link href="/services" className="py-2 text-gray-700 hover:text-blue-600">Services</Link>
              <Link href="/about" className="py-2 text-gray-700 hover:text-blue-600">About</Link>
              <Link href="/contact" className="py-2 text-gray-700 hover:text-blue-600">Contact</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}