# Design Document: Corporate Website

## Overview

The Al Mazahir Trading Est. corporate website will be implemented as a modern, SEO-optimized single-page application that serves as both a digital catalog and lead generation platform. The design prioritizes performance, mobile responsiveness, and conversion optimization while maintaining professional industrial branding.

The architecture leverages server-side rendering for optimal SEO performance while providing a smooth, interactive user experience typical of modern web applications. The website will be built with scalability in mind to support future e-commerce integration and multi-page expansion.

## Architecture

### Technology Stack

**Frontend Framework**: Next.js with React
- Server-side rendering (SSR) for optimal SEO performance
- Static site generation (SSG) for fast loading
- Built-in image optimization and performance features
- Excellent developer experience and maintainability

**Styling**: Tailwind CSS
- Utility-first approach for rapid development
- Responsive design system
- Consistent spacing and typography
- Easy customization for brand colors

**Hosting**: Vercel or AWS Amplify
- Automatic deployments from Git
- Global CDN for fast content delivery
- Built-in performance monitoring
- Scalable infrastructure

### Application Structure

```
/pages
  ├── index.js (Main single-page application)
  ├── _app.js (Global app configuration)
  └── _document.js (HTML document structure)

/components
  ├── sections/
  │   ├── HeroSection.js
  │   ├── AboutSection.js
  │   ├── ProductCatalog.js
  │   ├── TrustIndicators.js
  │   ├── IndustriesSection.js
  │   └── ContactSection.js
  ├── ui/
  │   ├── Button.js
  │   ├── Card.js
  │   ├── Modal.js
  │   └── Form.js
  └── layout/
      ├── Header.js
      ├── Footer.js
      └── Navigation.js

/lib
  ├── email.js (Email sending functionality)
  ├── validation.js (Form validation)
  └── analytics.js (Google Analytics integration)

/public
  ├── images/
  └── icons/
```

## Components and Interfaces

### Core Components

#### HeroSection Component
- **Purpose**: First impression and primary call-to-action
- **Props**: `title`, `subtitle`, `ctaButtons`, `backgroundImage`
- **Features**: 
  - Responsive hero image with overlay
  - Prominent CTA buttons
  - Mobile-optimized layout
  - Smooth scroll to sections

#### ProductCatalog Component
- **Purpose**: Display product categories with interactive navigation
- **Props**: `categories`, `onCategorySelect`
- **Features**:
  - Grid layout for product categories
  - Modal or expandable sections for product details
  - Image lazy loading for performance
  - Search and filter capabilities (future enhancement)

#### ContactForm Component
- **Purpose**: Lead capture and inquiry management
- **Props**: `onSubmit`, `fields`, `validation`
- **Features**:
  - Real-time form validation
  - WhatsApp integration
  - Email notification system
  - Success/error state management

#### TrustIndicators Component
- **Purpose**: Build credibility through visual elements
- **Props**: `indicators`, `layout`
- **Features**:
  - Icon-based trust signals
  - Animated counters for statistics
  - Responsive grid layout

### Data Models

#### Product Category Model
```typescript
interface ProductCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  products: Product[];
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
}
```

#### Contact Inquiry Model
```typescript
interface ContactInquiry {
  name: string;
  company: string;
  phone: string;
  email: string;
  productRequirement: string;
  message: string;
  timestamp: Date;
  source: 'form' | 'whatsapp';
}
```

#### Company Information Model
```typescript
interface CompanyInfo {
  name: string;
  description: string;
  yearsOfExperience: number;
  location: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  trustIndicators: TrustIndicator[];
  industries: Industry[];
}

interface TrustIndicator {
  icon: string;
  title: string;
  description: string;
}

interface Industry {
  name: string;
  icon: string;
  description: string;
}
```

### API Interfaces

#### Email Service Interface
```typescript
interface EmailService {
  sendInquiry(inquiry: ContactInquiry): Promise<EmailResult>;
  validateEmail(email: string): boolean;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

#### WhatsApp Integration Interface
```typescript
interface WhatsAppService {
  generateWhatsAppUrl(message: string, phoneNumber: string): string;
  formatInquiryMessage(inquiry: ContactInquiry): string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following properties ensure the website meets all functional requirements:

### Property 1: Product Catalog Interaction Consistency
*For any* product category in the catalog, clicking on it should display relevant products with images, descriptions, and an "Enquire Now" button in a consistent grid layout.
**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 2: Form Submission and Communication
*For any* valid contact inquiry submitted through the system, the inquiry should be sent via email and WhatsApp integration should generate proper URLs with pre-filled messages.
**Validates: Requirements 3.2, 3.4**

### Property 3: Form Validation Consistency
*For any* combination of form inputs, the validation system should consistently reject invalid inputs and accept valid inputs according to the defined rules.
**Validates: Requirements 3.5**

### Property 4: Responsive Design Behavior
*For any* screen width between 320px and 1920px, the website should maintain proper layout, readable typography, accessible touch targets, and full functionality.
**Validates: Requirements 5.1, 5.2, 5.5**

### Property 5: Performance and Optimization
*For any* page load or image display, the website should meet performance standards including load times under 3 seconds and optimized image delivery.
**Validates: Requirements 1.5, 5.3, 6.3**

### Property 6: Visual and Brand Consistency
*For any* page element or component, the design should maintain consistent red/navy blue branding and professional visual standards.
**Validates: Requirements 4.5**

### Property 7: Navigation Smoothness
*For any* scroll or navigation action, the website should provide smooth transitions and proper section navigation behavior.
**Validates: Requirements 1.2**

## Error Handling

### Form Validation Errors
- **Invalid Email Format**: Display inline error message with proper email format guidance
- **Missing Required Fields**: Highlight missing fields with clear error indicators
- **Network Errors**: Show user-friendly error message with retry option
- **WhatsApp Integration Failure**: Fallback to email-only submission with notification

### Performance Error Handling
- **Slow Loading**: Display loading indicators and progressive content loading
- **Image Load Failures**: Show placeholder images with retry mechanism
- **JavaScript Errors**: Graceful degradation to basic HTML functionality

### Responsive Design Fallbacks
- **Unsupported Browsers**: Basic CSS fallbacks for older browsers
- **JavaScript Disabled**: Core functionality remains accessible
- **Slow Connections**: Optimized content delivery and progressive enhancement

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and integration points
- Test specific form validation scenarios
- Verify exact content requirements (sections, buttons, contact info)
- Test WhatsApp URL generation with known inputs
- Validate email sending functionality with mock services

**Property-Based Tests**: Verify universal properties across all inputs
- Test form validation with randomly generated valid/invalid inputs (minimum 100 iterations)
- Test responsive behavior across random viewport sizes (minimum 100 iterations)
- Test product catalog interactions with various category configurations (minimum 100 iterations)
- Test performance characteristics under different load conditions (minimum 100 iterations)

### Property-Based Testing Configuration

**Testing Library**: fast-check for JavaScript/TypeScript property-based testing
**Test Iterations**: Minimum 100 iterations per property test
**Test Tagging**: Each property test must reference its design document property

Tag format: **Feature: corporate-website, Property {number}: {property_text}**

### Testing Requirements

**Unit Testing Focus**:
- Specific examples demonstrating correct behavior
- Edge cases and error conditions
- Integration between components
- Exact content and structure validation

**Property Testing Focus**:
- Universal properties holding for all valid inputs
- Comprehensive input coverage through randomization
- Performance and behavior consistency
- Cross-browser and cross-device compatibility

**Test Organization**:
- Co-locate tests with components using `.test.js` suffix
- Separate unit tests and property tests into distinct test suites
- Use descriptive test names explaining what is being validated
- Include requirement references in test descriptions

### Performance Testing

**Load Time Validation**:
- Test page load times under simulated network conditions
- Validate image optimization and lazy loading
- Measure Time to First Contentful Paint (FCP)
- Test Core Web Vitals compliance

**Responsive Testing**:
- Automated testing across device viewports
- Touch target size validation on mobile
- Typography readability testing
- Layout integrity verification

### SEO and Accessibility Testing

**SEO Validation**:
- Meta tag presence and content validation
- Schema markup validation
- Heading hierarchy testing
- Image alt text verification

**Accessibility Testing**:
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- ARIA label verification

This comprehensive testing approach ensures the website meets all functional requirements while maintaining high quality, performance, and user experience standards across all devices and use cases.