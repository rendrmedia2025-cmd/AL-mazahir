'use client';

import React, { useState } from 'react';
import { ProductCategory } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DynamicCTA } from '@/components/ui';
import { OptimizedImage, ProductImage, CategoryImage } from '@/components/ui/OptimizedImage';
import type { CTAAction } from '@/components/ui/DynamicCTA';
import { LazyLoad, getOptimizedImageProps } from '@/lib/performance';
import { cn } from '@/lib/utils';
import { trackProductInquiry } from '@/lib/analytics';

export interface ProductCatalogProps {
  categories: ProductCategory[];
  onEnquireNow?: (category: ProductCategory) => void;
  onCTAAction?: (action: CTAAction, category: ProductCategory) => void;
  className?: string;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({
  categories,
  onEnquireNow,
  onCTAAction,
  className
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCategoryClick = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleCTAAction = async (action: CTAAction, category: ProductCategory) => {
    // Track product inquiry based on CTA action type
    try {
      trackProductInquiry(`${category.name}_${action.type}`);
    } catch (error) {
      console.error('Error tracking CTA action:', error);
    }
    
    // Call custom CTA action handler if provided
    if (onCTAAction) {
      await onCTAAction(action, category);
      return;
    }
    
    // Default behavior: call the legacy enquire handler
    if (onEnquireNow) {
      onEnquireNow(category);
    } else {
      // Default fallback: scroll to contact section
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  return (
    <section className={cn('py-16 lg:py-24 bg-white', className)} id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-brand-navy-900 mb-6">
            Our Product Categories
          </h2>
          <p className="text-lg text-brand-navy-600 max-w-2xl mx-auto">
            Explore our comprehensive range of safety equipment, industrial supplies, 
            and construction materials sourced from trusted manufacturers worldwide.
          </p>
        </div>

        {/* Product Categories Grid with Lazy Loading */}
        <LazyLoad fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-industrial-gray-200 animate-pulse rounded-lg h-80"></div>
            ))}
          </div>
        }>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {categories.map((category, index) => (
              <Card 
                key={category.id} 
                className={`group cursor-pointer touch-target animate-fade-in-up animate-stagger-${Math.min(index + 1, 6)}`}
                onClick={() => handleCategoryClick(category)}
              >
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <CategoryImage
                      src={category.image}
                      categoryName={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      priority={index < 3}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-900/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-brand-red-600/0 group-hover:bg-brand-red-600/10 transition-colors duration-300" />
                  </div>
                </CardHeader>
                
                <CardContent className="transition-all duration-200 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="heading-5 text-brand-navy-900 group-hover:text-brand-red-600 transition-colors duration-300 flex-1">
                      {category.name}
                    </h3>
                    <div className="ml-3 flex-shrink-0">
                      {/* Temporarily disabled to fix content unavailable issue */}
                      <div className="inline-flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">Available</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-body text-brand-navy-600 line-clamp-3">
                    {category.description}
                  </p>
                </CardContent>
                
                <CardFooter className="flex items-center p-6 pt-0 px-6 pb-6">
                  <DynamicCTA
                    categoryId={category.id}
                    onAction={(action) => handleCTAAction(action, category)}
                    className="w-full"
                    size="md"
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        </LazyLoad>

        {/* Product Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={selectedCategory?.name}
          size="xl"
        >
          {selectedCategory && (
            <div className="space-y-6">
              {/* Category Header with Availability */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-body text-brand-navy-700 mb-4">
                    {selectedCategory.description}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  {/* Temporarily disabled to fix content unavailable issue */}
                  <div className="inline-flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Available</span>
                  </div>
                </div>
              </div>

              {/* Products Grid with Lazy Loading */}
              {selectedCategory.products && selectedCategory.products.length > 0 ? (
                <LazyLoad>
                  <div>
                    <h4 className="heading-5 text-brand-navy-900 mb-4">
                      Available Products
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedCategory.products.map((product) => (
                        <div
                          key={product.id}
                          className="card-industrial p-4 group"
                        >
                          <div className="relative h-32 w-full mb-3 overflow-hidden rounded-md">
                            <ProductImage
                              src={product.image}
                              productName={product.name}
                              category={product.category}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          </div>
                          <h5 className="heading-6 text-brand-navy-900 mb-2">
                            {product.name}
                          </h5>
                          <p className="text-body-small text-brand-navy-600 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </LazyLoad>
              ) : (
                <div className="text-center py-8">
                  <p className="text-body text-brand-navy-500">
                    Product details will be available soon. Contact us for more information.
                  </p>
                </div>
              )}

              {/* Modal Footer with Dynamic CTA */}
              <div className="flex justify-end pt-4 border-t border-industrial-gray-200">
                <DynamicCTA
                  categoryId={selectedCategory.id}
                  onAction={(action) => {
                    handleCTAAction(action, selectedCategory);
                    closeModal();
                  }}
                  size="md"
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </section>
  );
};

export default ProductCatalog;
export { ProductCatalog };