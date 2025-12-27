# Al Mazahir Trading - API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Al Mazahir Trading platform. The API follows RESTful principles and returns JSON responses with consistent error handling.

## Base URLs

- **Production**: `https://almazahir.com/api`
- **Staging**: `https://staging.almazahir.com/api`
- **Development**: `http://localhost:3000/api`

## Authentication

### Admin Authentication
Admin endpoints require authentication via JWT tokens stored in HTTP-only cookies.

**Login Endpoint**: `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@almazahir.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@almazahir.com",
    "role": "admin"
  },
  "message": "Login successful"
}
```

### Authorization Headers
For API testing, include the session cookie or use the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error details */ }
  }
}
```

## Public APIs

### Availability Status

#### GET /api/availability
Returns current availability status for all product categories.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "construction-materials": {
      "status": "in_stock",
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "safety-equipment": {
      "status": "limited",
      "lastUpdated": "2024-01-15T09:15:00Z"
    },
    "tools-machinery": {
      "status": "out_of_stock",
      "lastUpdated": "2024-01-14T16:45:00Z"
    }
  },
  "cached": true,
  "cacheExpiry": "2024-01-15T10:35:00Z"
}
```

**Status Values:**
- `in_stock`: Products readily available
- `limited`: Low inventory levels
- `out_of_stock`: Currently unavailable
- `on_order`: Available with lead time

**Caching:** 5-minute ISR cache

### Lead Submission

#### POST /api/public/leads
Submits a new customer inquiry.

**Request Body:**
```json
{
  "name": "John Doe",
  "company": "ABC Construction",
  "email": "john@abc.com",
  "phone": "+966501234567",
  "productCategory": "construction-materials",
  "urgency": "immediate",
  "quantityEstimate": "100 bags",
  "message": "Need cement for urgent project",
  "sourceSection": "hero",
  "recaptchaToken": "optional_recaptcha_token"
}
```

**Field Validation:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format
- `phone`: Optional, valid phone format
- `productCategory`: Required, must exist in categories
- `urgency`: Required, one of: `immediate`, `1-2_weeks`, `planning`
- `message`: Required, 10-1000 characters

**Response:**
```json
{
  "success": true,
  "data": {
    "leadId": "550e8400-e29b-41d4-a716-446655440000",
    "whatsappUrl": "https://wa.me/966501234567?text=Hello%20Al%20Mazahir..."
  },
  "message": "Lead submitted successfully"
}
```

**Rate Limiting:** 5 requests per minute per IP

### Testimonials

#### GET /api/public/testimonials
Returns published testimonials for display.

**Query Parameters:**
- `limit`: Number of testimonials (default: 10, max: 50)
- `featured`: Boolean, return only featured testimonials

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Ahmed Al-Rashid",
      "company": "Saudi Construction Co.",
      "content": "Excellent service and quality products...",
      "rating": 5,
      "isFeatured": true,
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

## Admin APIs

### Dashboard Statistics

#### GET /api/admin/dashboard-stats
Returns key metrics for the admin dashboard.

**Authentication:** Required (Admin/Manager)

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": {
      "total": 1250,
      "new": 23,
      "thisMonth": 156,
      "conversionRate": 0.23
    },
    "availability": {
      "totalCategories": 6,
      "inStock": 4,
      "limited": 1,
      "outOfStock": 1
    },
    "performance": {
      "avgLoadTime": 1.2,
      "errorRate": 0.001,
      "uptime": 0.999
    },
    "system": {
      "health": "healthy",
      "lastBackup": "2024-01-15T02:00:00Z",
      "activeUsers": 3
    }
  }
}
```

### Availability Management

#### GET /api/admin/availability
Returns detailed availability information for admin management.

**Authentication:** Required (Admin/Manager)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "categoryId": "construction-materials",
      "categoryName": "Construction Materials",
      "status": "in_stock",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "updatedBy": {
        "id": "uuid",
        "name": "Admin User"
      },
      "adminOverride": false,
      "notes": "Regular stock levels"
    }
  ]
}
```

#### PUT /api/admin/availability/:categoryId
Updates availability status for a specific category.

**Authentication:** Required (Admin/Manager)

**Path Parameters:**
- `categoryId`: UUID of the product category

**Request Body:**
```json
{
  "status": "limited",
  "notes": "Low stock, reorder scheduled",
  "adminOverride": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "categoryId": "construction-materials",
    "status": "limited",
    "lastUpdated": "2024-01-15T11:00:00Z",
    "notes": "Low stock, reorder scheduled"
  },
  "message": "Availability status updated successfully"
}
```

### Lead Management

#### GET /api/admin/leads
Retrieves leads with filtering and pagination.

**Authentication:** Required (Admin/Manager)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (`new`, `contacted`, `qualified`, `converted`, `closed`)
- `category`: Filter by product category ID
- `urgency`: Filter by urgency level
- `dateFrom`: Start date (ISO 8601 format)
- `dateTo`: End date (ISO 8601 format)
- `search`: Search in name, company, or message

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "uuid",
        "name": "John Doe",
        "company": "ABC Construction",
        "email": "john@abc.com",
        "phone": "+966501234567",
        "productCategory": {
          "id": "uuid",
          "name": "Construction Materials"
        },
        "urgency": "immediate",
        "quantityEstimate": "100 bags",
        "message": "Need cement for urgent project",
        "status": "new",
        "sourceSection": "hero",
        "deviceType": "desktop",
        "createdAt": "2024-01-15T09:30:00Z",
        "metadata": {
          "userAgent": "Mozilla/5.0...",
          "referrer": "https://google.com",
          "ipAddress": "192.168.1.1"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### PUT /api/admin/leads/:leadId
Updates lead status and information.

**Authentication:** Required (Admin/Manager)

**Path Parameters:**
- `leadId`: UUID of the lead

**Request Body:**
```json
{
  "status": "contacted",
  "assignedTo": "admin-user-id",
  "notes": "Called customer, scheduled meeting"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "contacted",
    "assignedTo": "admin-user-id",
    "updatedAt": "2024-01-15T12:00:00Z"
  },
  "message": "Lead updated successfully"
}
```

### Content Management

#### GET /api/admin/content
Returns current content settings.

**Authentication:** Required (Admin/Manager)

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "phone": "+966-11-XXX-XXXX",
      "whatsapp": "+966-5X-XXX-XXXX",
      "email": "info@almazahir.com"
    },
    "hero": {
      "title": "Leading Industrial Supplier in Saudi Arabia",
      "subtitle": "Quality products and reliable service",
      "ctaText": "Get Quote"
    },
    "categories": [
      {
        "id": "uuid",
        "name": "Construction Materials",
        "isActive": true,
        "displayOrder": 1
      }
    ]
  }
}
```

#### PUT /api/admin/content
Updates content settings.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "contact": {
    "phone": "+966-11-XXX-XXXX",
    "whatsapp": "+966-5X-XXX-XXXX",
    "email": "info@almazahir.com"
  },
  "hero": {
    "title": "Updated title",
    "subtitle": "Updated subtitle",
    "ctaText": "Updated CTA"
  }
}
```

### Feature Flags

#### GET /api/admin/feature-flags
Returns all feature flags with their current status.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "testimonial_slider",
      "description": "Enable testimonial slider on homepage",
      "isEnabled": true,
      "rolloutPercentage": 100,
      "targetAudience": null,
      "createdAt": "2024-01-10T10:00:00Z",
      "updatedAt": "2024-01-15T14:00:00Z"
    }
  ]
}
```

#### PUT /api/admin/feature-flags/:flagId
Updates a feature flag configuration.

**Authentication:** Required (Admin)

**Path Parameters:**
- `flagId`: UUID of the feature flag

**Request Body:**
```json
{
  "isEnabled": true,
  "rolloutPercentage": 50,
  "targetAudience": {
    "userTypes": ["admin"],
    "regions": ["riyadh"]
  }
}
```

### Monitoring

#### GET /api/admin/monitoring/health
Returns system health status.

**Authentication:** Required (Admin/Manager)

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T15:00:00Z",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 45,
        "connections": 12
      },
      "api": {
        "status": "healthy",
        "responseTime": 120,
        "errorRate": 0.001
      },
      "external": {
        "whatsapp": "healthy",
        "email": "healthy"
      }
    },
    "metrics": {
      "uptime": 0.999,
      "memoryUsage": 0.65,
      "cpuUsage": 0.23
    }
  }
}
```

#### GET /api/admin/monitoring/performance
Returns performance metrics.

**Authentication:** Required (Admin/Manager)

**Query Parameters:**
- `period`: Time period (`1h`, `24h`, `7d`, `30d`)
- `metric`: Specific metric to retrieve

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "metrics": {
      "coreWebVitals": {
        "lcp": 1.2,
        "fid": 0.08,
        "cls": 0.05
      },
      "apiPerformance": {
        "avgResponseTime": 150,
        "p95ResponseTime": 300,
        "errorRate": 0.002
      },
      "pageViews": 1250,
      "uniqueVisitors": 890
    },
    "trends": {
      "responseTime": [120, 135, 150, 145, 140],
      "errorRate": [0.001, 0.002, 0.001, 0.003, 0.002]
    }
  }
}
```

#### GET /api/admin/monitoring/errors
Returns recent error logs.

**Authentication:** Required (Admin)

**Query Parameters:**
- `limit`: Number of errors to return (default: 50)
- `severity`: Filter by severity (`low`, `medium`, `high`, `critical`)
- `since`: Return errors since timestamp

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "timestamp": "2024-01-15T14:30:00Z",
      "severity": "medium",
      "message": "Database connection timeout",
      "stack": "Error stack trace...",
      "context": {
        "userId": "uuid",
        "endpoint": "/api/admin/leads",
        "userAgent": "Mozilla/5.0..."
      },
      "resolved": false
    }
  ]
}
```

## Error Codes

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Specific Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Login credentials are incorrect |
| `SESSION_EXPIRED` | User session has expired |
| `CATEGORY_NOT_FOUND` | Product category does not exist |
| `LEAD_NOT_FOUND` | Lead record does not exist |
| `DUPLICATE_EMAIL` | Email address already exists |
| `INVALID_STATUS` | Invalid status value provided |
| `FEATURE_FLAG_NOT_FOUND` | Feature flag does not exist |

## Rate Limiting

### Public Endpoints
- **Lead Submission**: 5 requests per minute per IP
- **Availability Check**: 60 requests per minute per IP
- **General Public APIs**: 100 requests per minute per IP

### Admin Endpoints
- **Admin APIs**: 1000 requests per minute per user
- **Bulk Operations**: 10 requests per minute per user
- **Export Operations**: 5 requests per minute per user

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1642248000
```

## Webhooks

### Lead Notification Webhook
Triggered when a new lead is submitted.

**URL**: Configured in admin panel
**Method**: POST
**Headers**: 
```
Content-Type: application/json
X-Webhook-Signature: sha256=<signature>
```

**Payload:**
```json
{
  "event": "lead.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "leadId": "uuid",
    "name": "John Doe",
    "company": "ABC Construction",
    "email": "john@abc.com",
    "productCategory": "construction-materials",
    "urgency": "immediate"
  }
}
```

## SDK and Client Libraries

### JavaScript/TypeScript Client
```typescript
import { AlMazahirAPI } from '@almazahir/api-client';

const client = new AlMazahirAPI({
  baseURL: 'https://almazahir.com/api',
  apiKey: 'your-api-key'
});

// Submit a lead
const lead = await client.leads.create({
  name: 'John Doe',
  email: 'john@example.com',
  // ... other fields
});

// Get availability
const availability = await client.availability.get();
```

### cURL Examples

#### Submit Lead
```bash
curl -X POST https://almazahir.com/api/public/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "productCategory": "construction-materials",
    "urgency": "immediate",
    "message": "Need cement for project"
  }'
```

#### Get Availability (Admin)
```bash
curl -X GET https://almazahir.com/api/admin/availability \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"
```

## Testing

### Test Environment
- **Base URL**: `https://staging.almazahir.com/api`
- **Test Credentials**: Contact development team
- **Rate Limits**: Relaxed for testing

### Postman Collection
Import the Postman collection from: `/docs/postman/almazahir-api.json`

### API Testing Tools
- **Postman**: GUI-based API testing
- **Insomnia**: Alternative API client
- **curl**: Command-line testing
- **HTTPie**: User-friendly command-line tool

---

*This API documentation is automatically updated with each release. For the latest version, visit the admin panel's API documentation section.*