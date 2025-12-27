'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getImageAlt, getImageTitle, getImageMetadata } from '@/lib/data/image-metadata';

interface OptimizedImageProps {
  src: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
}

/**
 * Optimized Image component with automatic SEO and accessibility metadata
 * Uses the autonomous asset intelligence system's generated metadata
 */
export function OptimizedImage({
  src,
  width = 400,
  height = 300,
  className = '',
  priority = false,
  sizes,
  fill = false,
  style,
  ...props
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  
  // Get metadata for the image
  const metadata = getImageMetadata(src);
  const alt = getImageAlt(src);
  const title = getImageTitle(src);

  // Fallback for images without metadata
  const fallbackAlt = src.includes('almazahir') 
    ? `Al Mazahir Trading Est. - Industrial Supplier Saudi Arabia`
    : 'Product image';

  // If image failed to load, show a placeholder
  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          ...style
        }}
      >
        <div className="text-center text-gray-500 p-4">
          <div className="text-2xl mb-2">📦</div>
          <div className="text-sm">Al Mazahir Trading Est.</div>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || fallbackAlt}
      title={title}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={className}
      priority={priority}
      sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      style={style}
      quality={85}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      onError={() => setImageError(true)}
      {...props}
    />
  );
}

/**
 * Product Image component specifically for product displays
 */
export function ProductImage({
  src,
  productName,
  category,
  className = '',
  ...props
}: OptimizedImageProps & {
  productName?: string;
  category?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      className={`rounded-lg object-cover ${className}`}
      {...props}
    />
  );
}

/**
 * Category Image component for category displays
 */
export function CategoryImage({
  src,
  categoryName,
  className = '',
  ...props
}: OptimizedImageProps & {
  categoryName?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      className={`rounded-lg object-cover ${className}`}
      {...props}
    />
  );
}