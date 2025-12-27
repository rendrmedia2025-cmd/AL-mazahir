/**
 * API Module - Central exports for all API-related functionality
 * Requirements: 1.1, 3.1, 4.1, 5.1
 */

export * from './contracts';
export * from './openapi';

// Re-export commonly used types
export type {
  ApiResponse,
  ValidationErrorResponse,
  PaginatedResponse,
  PaginationMeta,
  ApiEndpoint,
  HttpMethod,
  ApiRequestConfig,
  ApiClientResponse
} from './contracts';