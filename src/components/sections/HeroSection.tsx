'use client'

import { useState } from 'react'

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "Your Trusted Industrial Partner",
      subtitle: "Leading provider of industrial safety equipment and construction materials",
      image: "/images/hero/industrial-1.jpg",
      cta: "Explore Products"
    },
    {
      title: "Safety First, Quality Always",
      subtitle: "Comprehensive safety solutions for industrial applications",
      image: "/images/hero/safety-1.jpg", 
      cta: "Safety Equipment"
    },
    {
      title: "GCC-Wide Service Network",
      subtitle: "Serving industries across Saudi Arabia and the Gulf region",
      image: "/images/hero/logistics-1.jpg",
      cta: "Our Services"
    }
  ]

  return (
    <section className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/images/patterns/industrial-grid.svg')] bg-repeat"></div>
      </div>

      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-blue-600/30 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Serving Industries Since 2010
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                {slides[currentSlide].title}
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed">
                {slides[currentSlide].subtitle}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 py-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">15+</div>
                <div className="text-sm text-blue-200">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">500+</div>
                <div className="text-sm text-blue-200">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">24/7</div>
                <div className="text-sm text-blue-200">Support</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
                {slides[currentSlide].cta}
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-all duration-300">
                Get Quote
              </button>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="relative w-full h-96 lg:h-[500px] bg-gradient-to-br from-blue-600/20 to-transparent rounded-2xl overflow-hidden">
              {/* Placeholder for hero image */}
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">
                🏭
              </div>
              
              {/* Floating Cards */}
              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Online Support</span>
                </div>
              </div>
              
              <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Fast Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center mt-12 space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  )
}