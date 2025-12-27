export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Al Mazahir Trading Est.
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Your trusted partner for industrial safety equipment and supplies across Saudi Arabia and the GCC region.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Safety Equipment</h3>
            <p className="text-gray-600">Professional safety gear and protective equipment for industrial applications.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Industrial Supplies</h3>
            <p className="text-gray-600">Comprehensive range of industrial materials and supplies for your projects.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Equipment Rental</h3>
            <p className="text-gray-600">Reliable equipment rental services with flexible terms and expert support.</p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-4">Ready to discuss your industrial needs?</p>
          <a 
            href="https://wa.me/966XXXXXXXXX" 
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Contact via WhatsApp
          </a>
        </div>
      </div>
    </main>
  )
}