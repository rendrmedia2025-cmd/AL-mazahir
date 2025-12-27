/**
 * Email service integration for Al Mazahir Trading Est. corporate website
 * Handles email sending functionality using EmailJS
 */

// Temporarily disable EmailJS import to fix SSR issue
// import emailjs from '@emailjs/browser';
import { ContactInquiry, EnhancedInquiry, EmailResult, EmailService } from './types';
import { isValidEmail } from './validation';
import { productCategories } from './data/products';

// EmailJS configuration - these should be set as environment variables in production
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key';

// Initialize EmailJS only on client side
let isEmailJSInitialized = false;

/**
 * Email service implementation using EmailJS
 */
export class EmailJSService implements EmailService {
  /**
   * Sends a contact inquiry via email
   */
  async sendInquiry(inquiry: ContactInquiry): Promise<EmailResult> {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Email service is only available on the client side'
        };
      }

      // Validate email before sending
      if (!this.validateEmail(inquiry.email)) {
        return {
          success: false,
          error: 'Invalid email address format'
        };
      }

      // Dynamically import EmailJS
      const emailjs = await import('@emailjs/browser');
      
      // Initialize if not already done
      if (!isEmailJSInitialized) {
        emailjs.default.init(EMAILJS_PUBLIC_KEY);
        isEmailJSInitialized = true;
      }

      // Prepare template parameters for EmailJS
      const templateParams = {
        from_name: inquiry.name,
        from_company: inquiry.company,
        from_email: inquiry.email,
        from_phone: inquiry.phone,
        product_requirement: inquiry.productRequirement,
        message: inquiry.message || 'No additional message provided',
        timestamp: inquiry.timestamp.toLocaleString(),
        source: inquiry.source,
        to_email: 'info@almazahir.com', // Company email
      };

      // Send email using EmailJS
      const response = await emailjs.default.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      if (response.status === 200) {
        return {
          success: true,
          messageId: response.text
        };
      } else {
        return {
          success: false,
          error: `Email service returned status: ${response.status}`
        };
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Sends an enhanced inquiry via email with smart field data
   */
  async sendEnhancedInquiry(inquiry: EnhancedInquiry): Promise<EmailResult> {
    try {
      // Check if we're on the client side
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Email service is only available on the client side'
        };
      }

      // Validate email before sending
      if (!this.validateEmail(inquiry.email)) {
        return {
          success: false,
          error: 'Invalid email address format'
        };
      }

      // Dynamically import EmailJS
      const emailjs = await import('@emailjs/browser');
      
      // Initialize if not already done
      if (!isEmailJSInitialized) {
        emailjs.default.init(EMAILJS_PUBLIC_KEY);
        isEmailJSInitialized = true;
      }

      // Get category display name
      const categoryName = inquiry.productCategory ? 
        this.getCategoryDisplayName(inquiry.productCategory) : 
        'General Inquiry';

      // Format urgency text
      const urgencyText = this.formatUrgencyText(inquiry.urgency);

      // Create enhanced subject line with category
      const subject = `[${categoryName}] New ${urgencyText} Inquiry from Al Mazahir Website`;

      // Prepare template parameters for EmailJS with enhanced data
      const templateParams = {
        from_name: inquiry.name,
        from_company: inquiry.company || 'Individual',
        from_email: inquiry.email,
        from_phone: inquiry.phone,
        product_category: categoryName,
        urgency_level: urgencyText,
        quantity_estimate: inquiry.quantityEstimate || 'Not specified',
        message: inquiry.message,
        source_section: inquiry.sourceSection,
        device_type: inquiry.deviceType || 'Unknown',
        timestamp: inquiry.timestamp.toLocaleString(),
        source: inquiry.source,
        to_email: 'info@almazahir.com',
        subject: subject,
      };

      // Use enhanced template if available, otherwise fall back to regular template
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_ENHANCED_TEMPLATE_ID || EMAILJS_TEMPLATE_ID;

      // Send email using EmailJS
      const response = await emailjs.default.send(
        EMAILJS_SERVICE_ID,
        templateId,
        templateParams
      );

      if (response.status === 200) {
        return {
          success: true,
          messageId: response.text
        };
      } else {
        return {
          success: false,
          error: `Email service returned status: ${response.status}`
        };
      }
    } catch (error) {
      console.error('Enhanced email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
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
        return 'Urgent';
      case '1-2_weeks':
        return 'Standard';
      case 'planning':
        return 'Planning';
      default:
        return 'Standard';
    }
  }

  /**
   * Validates email format
   */
  validateEmail(email: string): boolean {
    return isValidEmail(email);
  }
}

/**
 * Default email service instance
 */
export const emailService = new EmailJSService();

/**
 * Enhanced email template configuration for EmailJS with smart fields
 */
export const ENHANCED_EMAIL_TEMPLATE_CONFIG = {
  subject: '[{{product_category}}] New {{urgency_level}} Inquiry from Al Mazahir Website',
  template: `
    New enhanced inquiry received from Al Mazahir Trading Est. website:

    Customer Information:
    - Name: {{from_name}}
    - Company: {{from_company}}
    - Email: {{from_email}}
    - Phone/WhatsApp: {{from_phone}}

    Inquiry Details:
    - Product Category: {{product_category}}
    - Urgency Level: {{urgency_level}}
    - Quantity Estimate: {{quantity_estimate}}
    - Source Section: {{source_section}}

    Message:
    {{message}}

    Technical Details:
    - Device Type: {{device_type}}
    - Submission Time: {{timestamp}}
    - Source: {{source}}

    Priority Level: {{urgency_level}}
    
    Please respond to this inquiry according to the urgency level:
    - Urgent: Within 2 hours
    - Standard: Within 24 hours  
    - Planning: Within 48 hours

    Best regards,
    Al Mazahir Website System
  `
};

/**
 * Auto-reply email template for customers
 */
export const AUTO_REPLY_TEMPLATE_CONFIG = {
  subject: 'Thank you for your inquiry - Al Mazahir Trading Est.',
  template: `
    Dear {{from_name}},

    Thank you for your inquiry regarding our industrial and safety equipment services.

    We have received your request for:
    {{product_requirement}}

    Our team will review your requirements and get back to you within 24 hours with a detailed quote and consultation.

    In the meantime, feel free to contact us directly:
    - Phone: +966 50 123 4567
    - WhatsApp: +966 50 123 4567
    - Email: info@almazahir.com

    Best regards,
    Al Mazahir Trading Est.
    Your trusted partner for industrial solutions
  `
};

/**
 * Sends an auto-reply email to the customer
 */
export async function sendAutoReply(inquiry: ContactInquiry): Promise<EmailResult> {
  try {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'Auto-reply service is only available on the client side'
      };
    }

    // Dynamically import EmailJS
    const emailjs = await import('@emailjs/browser');
    
    // Initialize if not already done
    if (!isEmailJSInitialized) {
      emailjs.default.init(EMAILJS_PUBLIC_KEY);
      isEmailJSInitialized = true;
    }

    const templateParams = {
      to_email: inquiry.email,
      to_name: inquiry.name,
      from_name: inquiry.name,
      product_requirement: inquiry.productRequirement,
      company_name: 'Al Mazahir Trading Est.',
      company_phone: '+966 50 123 4567',
      company_email: 'info@almazahir.com'
    };

    // This would require a separate EmailJS template for auto-replies
    const AUTO_REPLY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID;
    
    if (!AUTO_REPLY_TEMPLATE_ID) {
      // Auto-reply is optional, so we don't fail if template is not configured
      return {
        success: true,
        messageId: 'auto-reply-not-configured'
      };
    }

    const response = await emailjs.default.send(
      EMAILJS_SERVICE_ID,
      AUTO_REPLY_TEMPLATE_ID,
      templateParams
    );

    return {
      success: response.status === 200,
      messageId: response.text,
      error: response.status !== 200 ? `Auto-reply failed with status: ${response.status}` : undefined
    };
  } catch (error) {
    console.error('Auto-reply email error:', error);
    // Don't fail the main process if auto-reply fails
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Auto-reply failed'
    };
  }
}

/**
 * Sends an enhanced auto-reply email to the customer with category-specific information
 */
export async function sendEnhancedAutoReply(inquiry: EnhancedInquiry): Promise<EmailResult> {
  try {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'Auto-reply service is only available on the client side'
      };
    }

    // Dynamically import EmailJS
    const emailjs = await import('@emailjs/browser');
    
    // Initialize if not already done
    if (!isEmailJSInitialized) {
      emailjs.default.init(EMAILJS_PUBLIC_KEY);
      isEmailJSInitialized = true;
    }

    // Get category display name
    const categoryName = inquiry.productCategory ? 
      emailService.getCategoryDisplayName(inquiry.productCategory) : 
      'our products and services';

    // Format urgency-based response time
    const responseTime = inquiry.urgency === 'immediate' ? '2 hours' :
                        inquiry.urgency === '1-2_weeks' ? '24 hours' :
                        '48 hours';

    const templateParams = {
      to_email: inquiry.email,
      to_name: inquiry.name,
      from_name: inquiry.name,
      product_category: categoryName,
      urgency_level: emailService.formatUrgencyText(inquiry.urgency),
      quantity_estimate: inquiry.quantityEstimate || 'as discussed',
      response_time: responseTime,
      company_name: 'Al Mazahir Trading Est.',
      company_phone: '+966 50 123 4567',
      company_email: 'info@almazahir.com'
    };

    // Use enhanced auto-reply template if available
    const AUTO_REPLY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_ENHANCED_AUTO_REPLY_TEMPLATE_ID || 
                                   process.env.NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID;
    
    if (!AUTO_REPLY_TEMPLATE_ID) {
      // Auto-reply is optional, so we don't fail if template is not configured
      return {
        success: true,
        messageId: 'auto-reply-not-configured'
      };
    }

    const response = await emailjs.default.send(
      EMAILJS_SERVICE_ID,
      AUTO_REPLY_TEMPLATE_ID,
      templateParams
    );

    return {
      success: response.status === 200,
      messageId: response.text,
      error: response.status !== 200 ? `Enhanced auto-reply failed with status: ${response.status}` : undefined
    };
  } catch (error) {
    console.error('Enhanced auto-reply email error:', error);
    // Don't fail the main process if auto-reply fails
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Enhanced auto-reply failed'
    };
  }
}

/**
 * Comprehensive email sending function that handles both inquiry and auto-reply
 */
export async function sendInquiryWithAutoReply(inquiry: ContactInquiry): Promise<{
  inquiry: EmailResult;
  autoReply: EmailResult;
}> {
  const [inquiryResult, autoReplyResult] = await Promise.allSettled([
    emailService.sendInquiry(inquiry),
    sendAutoReply(inquiry)
  ]);

  return {
    inquiry: inquiryResult.status === 'fulfilled' 
      ? inquiryResult.value 
      : { success: false, error: 'Inquiry email failed' },
    autoReply: autoReplyResult.status === 'fulfilled' 
      ? autoReplyResult.value 
      : { success: false, error: 'Auto-reply failed' }
  };
}

/**
 * Comprehensive enhanced email sending function with smart field routing
 */
export async function sendEnhancedInquiryWithAutoReply(inquiry: EnhancedInquiry): Promise<{
  inquiry: EmailResult;
  autoReply: EmailResult;
}> {
  const [inquiryResult, autoReplyResult] = await Promise.allSettled([
    emailService.sendEnhancedInquiry(inquiry),
    sendEnhancedAutoReply(inquiry)
  ]);

  return {
    inquiry: inquiryResult.status === 'fulfilled' 
      ? inquiryResult.value 
      : { success: false, error: 'Enhanced inquiry email failed' },
    autoReply: autoReplyResult.status === 'fulfilled' 
      ? autoReplyResult.value 
      : { success: false, error: 'Enhanced auto-reply failed' }
  };
}