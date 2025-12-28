import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AM</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Al Mazahir Trading</h3>
                <p className="text-sm text-gray-400">Est. 2010</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              Leading provider of industrial safety equipment, construction materials, 
              and logistics solutions across Saudi Arabia and the GCC region.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                📘
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                🐦
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">LinkedIn</span>
                💼
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">WhatsApp</span>
                📱
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/products/safety" className="hover:text-white">Safety Equipment</Link></li>
              <li><Link href="/products/construction" className="hover:text-white">Construction Materials</Link></li>
              <li><Link href="/products/tools" className="hover:text-white">Tools & Machinery</Link></li>
              <li><Link href="/products/industrial" className="hover:text-white">Industrial Supplies</Link></li>
              <li><Link href="/products/fire-safety" className="hover:text-white">Fire Safety</Link></li>
              <li><Link href="/products/rental" className="hover:text-white">Equipment Rental</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/services/consultation" className="hover:text-white">Technical Consultation</Link></li>
              <li><Link href="/services/logistics" className="hover:text-white">Logistics Solutions</Link></li>
              <li><Link href="/services/maintenance" className="hover:text-white">Equipment Maintenance</Link></li>
              <li><Link href="/services/training" className="hover:text-white">Safety Training</Link></li>
              <li><Link href="/services/support" className="hover:text-white">24/7 Support</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-start space-x-3">
                <span>📍</span>
                <div>
                  <p>Al Mazahir Trading Est.</p>
                  <p>Industrial District</p>
                  <p>Riyadh 11564, Saudi Arabia</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span>📞</span>
                <span>+966 XX XXX XXXX</span>
              </div>
              <div className="flex items-center space-x-3">
                <span>📧</span>
                <span>info@almazahir.sa</span>
              </div>
              <div className="flex items-center space-x-3">
                <span>🕒</span>
                <span>Sun-Thu: 8:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Al Mazahir Trading Est. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link>
              <Link href="/sitemap" className="text-gray-400 hover:text-white text-sm">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}