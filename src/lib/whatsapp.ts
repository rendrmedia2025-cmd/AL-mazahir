/**
 * WhatsApp integration service for Al Mazahir Trading Est. corporate website
 * Handles WhatsApp URL generation and message formatting
 */

import { ContactInquiry, EnhancedInquiry, WhatsAppService } from './types';
import { productCategories } from './data/products';

// Company WhatsApp number (should be set as environment variable in production)
const COMPANY_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+966501234567';

/**
 * WhatsApp service implementation
 */
export class WhatsAppServiceImpl implements WhatsAppService {
  /**
   * Generates a WhatsApp URL with pre-filled message
   */
  generateWhatsAppUrl(message: string, phoneNumber: string = COMPANY_WHATSAPP_NUMBER): string {
    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Ensure phone number starts with country code
    const formattedPhoneNumber = cleanPhoneNumber.startsWith('+') 
      ? cleanPhoneNumber.substring(1) 
      : cleanPhoneNumber;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Generate WhatsApp URL
    return `https://wa.me/${formattedPhoneNumber}?text=${encodedMessage}`;
  }

  /**
   * Formats contact inquiry data into a WhatsApp message
   */
  formatInquiryMessage(inquiry: ContactInquiry): string {
    const message = `Hello Al Mazahir Trading Est.,

I am interested in your industrial and safety equipment services.

*Customer Details:*
• Name: ${inquiry.name}
• Company: ${inquiry.company}
• Email: ${inquiry.email}
• Phone: ${inquiry.phone}

*Inquiry Details:*
• Product Requirement: ${inquiry.productRequirement}${inquiry.message ? `
• Additional Message: ${inquiry.message}` : ''}

I would like to discuss pricing and availability. Please get back to me at your earliest convenience.

Thank you!`;

    return message;
  }

  /**
   * Formats enhanced inquiry data into a WhatsApp message with smart fields
   */
  formatEnhancedInquiryMessage(inquiry: EnhancedInquiry): string {
    // Get category name from ID
    const categoryName = inquiry.productCategory ? 
      this.getCategoryDisplayName(inquiry.productCategory) : 
      'general products';

    // Format urgency text
    const urgencyText = this.formatUrgencyText(inquiry.urgency);

    const message = `Hello Al Mazahir Trading Est.,

I submitted an inquiry on your website and would like to discuss my requirements.

*Customer Details:*
• Name: ${inquiry.name}
• Company: ${inquiry.company || 'Individual'}
• Email: ${inquiry.email}
• Phone: ${inquiry.phone}

*Inquiry Details:*
• Product Category: ${categoryName}
• Urgency: ${urgencyText}${inquiry.quantityEstimate ? `
• Quantity Estimate: ${inquiry.quantityEstimate}` : ''}
• Source: ${inquiry.sourceSection}

*Message:*
${inquiry.message}

Please get back to me at your earliest convenience.

Thank you!`;

    return message;
  }

  /**
   * Gets display name for product category
   */
  private getCategoryDisplayName(categoryId: string): string {
    const category = productCategories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Formats urgency level for display
   */
  private formatUrgencyText(urgency: 'immediate' | '1-2_weeks' | 'planning'): string {
    switch (urgency) {
      case 'immediate':
        return 'Immediate (Within 24 hours)';
      case '1-2_weeks':
        return 'Within 1-2 weeks';
      case 'planning':
        return 'Planning phase (Future project)';
      default:
        return urgency;
    }
  }
}

/**
 * Default WhatsApp service instance
 */
export const whatsappService = new WhatsAppServiceImpl();

/**
 * Opens WhatsApp with pre-filled inquiry message
 */
export function openWhatsAppInquiry(inquiry: ContactInquiry): void {
  const message = whatsappService.formatInquiryMessage(inquiry);
  const whatsappUrl = whatsappService.generateWhatsAppUrl(message);
  
  // Open WhatsApp in new window/tab
  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Opens WhatsApp with pre-filled enhanced inquiry message
 */
export function openWhatsAppEnhancedInquiry(inquiry: EnhancedInquiry): void {
  const message = whatsappService.formatEnhancedInquiryMessage(inquiry);
  const whatsappUrl = whatsappService.generateWhatsAppUrl(message);
  
  // Open WhatsApp in new window/tab
  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Generates a quick WhatsApp URL for general inquiries with category routing
 */
export function generateQuickWhatsAppUrl(productCategory?: string): string {
  let message: string;
  
  if (productCategory) {
    // Get category display name
    const category = productCategories.find(cat => cat.id === productCategory);
    const categoryName = category ? category.name : productCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    message = `Hello Al Mazahir Trading Est.,

I am interested in your *${categoryName}* products and services.

Could you please provide more information about:
• Available products in this category
• Pricing and quotations
• Delivery timeframes
• Technical specifications

I look forward to hearing from you.

Thank you!`;
  } else {
    message = `Hello Al Mazahir Trading Est.,

I am interested in your industrial and safety equipment services. Could you please provide more information about your products and services?

Thank you!`;
  }

  return whatsappService.generateWhatsAppUrl(message);
}

/**
 * Opens WhatsApp for a specific product category inquiry
 */
export function openProductCategoryWhatsApp(productCategory: string): void {
  const whatsappUrl = generateQuickWhatsAppUrl(productCategory);
  
  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Validates WhatsApp phone number format
 */
export function isValidWhatsAppNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters except +
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it's a valid international format
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(cleanNumber);
}

/**
 * Formats phone number for WhatsApp (ensures proper international format)
 */
export function formatPhoneForWhatsApp(phoneNumber: string): string {
  // Remove all non-digit characters except +
  let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // If number doesn't start with +, assume it's a Saudi number and add +966
  if (!cleanNumber.startsWith('+')) {
    // Remove leading 0 if present (common in Saudi numbers)
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }
    // Add Saudi country code
    cleanNumber = '+966' + cleanNumber;
  }
  
  return cleanNumber;
}

/**
 * Creates a WhatsApp button component props
 */
export interface WhatsAppButtonProps {
  inquiry?: Partial<ContactInquiry>;
  productCategory?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Utility function to handle WhatsApp button clicks
 */
export function handleWhatsAppButtonClick(props: WhatsAppButtonProps): void {
  if (props.inquiry && props.inquiry.name) {
    // If we have inquiry data, use it
    openWhatsAppInquiry(props.inquiry as ContactInquiry);
  } else if (props.productCategory) {
    // If we have a product category, use that
    openProductCategoryWhatsApp(props.productCategory);
  } else {
    // Otherwise, open general inquiry
    const whatsappUrl = generateQuickWhatsAppUrl();
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }
}

/**
 * Configuration for WhatsApp integration
 */
export const WHATSAPP_CONFIG = {
  companyNumber: COMPANY_WHATSAPP_NUMBER,
  businessHours: {
    start: '08:00',
    end: '18:00',
    timezone: 'Asia/Riyadh',
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  },
  autoReplyMessage: 'Thank you for contacting Al Mazahir Trading Est. We will respond to your message as soon as possible during business hours (8 AM - 6 PM, Saturday to Thursday).'
};