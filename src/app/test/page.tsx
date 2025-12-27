'use client';

import React from 'react';
import { ProductCatalog } from '@/components/sections/ProductCatalog';
import { IndustriesSection } from '@/components/sections/IndustriesSection';
import { productCategories } from '@/lib/data/products';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Test Page</h1>
        
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Product Categories Test</h2>
          <p className="mb-4">Categories count: {productCategories.length}</p>
          <div className="bg-gray-100 p-4 rounded">
            <pre>{JSON.stringify(productCategories.slice(0, 1), null, 2)}</pre>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Industries Section Test</h2>
          <IndustriesSection />
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Product Catalog Test</h2>
          <ProductCatalog 
            categories={productCategories}
            onEnquireNow={(category) => console.log('Enquire:', category.name)}
          />
        </div>
      </div>
    </div>
  );
}