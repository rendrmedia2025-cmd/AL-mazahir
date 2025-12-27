/**
 * OpenAPI 3.0 Specification for Enterprise Dynamic Platform APIs
 * Comprehensive API documentation for all enterprise endpoints
 * Requirements: 1.1, 3.1, 4.1, 5.1
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Al Mazahir Trading Est. - Enterprise Dynamic Platform API',
    description: 'Comprehensive API for enterprise-grade industrial trading platform with real-time status, intelligent lead management, and business intelligence capabilities.',
    version: '2.0.0',
    contact: {
      name: 'Al Mazahir Trading Est.',
      email: 'info@almazahir.com',
      url: 'https://almazahir.com'
    },
    license: {
      name: 'Proprietary',
      url: 'https://almazahir.com/license'
    }
  },
  servers: [
    {
      url: 'https://almazahir.com/api',
      description: 'Production server'
    },
    {
      url: 'https://staging.almazahir.com/api',
      description: 'Staging server'
    }
  ],
  paths: {
    '/status/operational': {
      get: {
        summary: 'Get Real-Time Operational Status',
        description: 'Retrieve current operational status across all business areas with real-time metrics and trends.',
        tags: ['Operational Status'],
        responses: {
          '200': {
            description: 'Operational status retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StatusEngineResponse'
                }
              }
            }
          }
        }
      }
    },
    '/public/leads': {
      post: {
        summary: 'Submit Enhanced Lead',
        description: 'Submit a new lead with comprehensive intelligence and behavioral data.',
        tags: ['Lead Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LeadOrchestrationRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Lead submitted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeadOrchestrationResponse'
                }
              }
            }
          }
        }
      }
    },
    '/admin/leads': {
      get: {
        summary: 'List Enhanced Leads',
        description: 'Retrieve paginated list of leads with filtering and sorting options.',
        tags: ['Lead Management', 'Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
          }
        ],
        responses: {
          '200': {
            description: 'Leads retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeadsListResponse'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      StatusEngineResponse: {
        type: 'object',
        required: ['success', 'data', 'metadata'],
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              operationalAreas: { type: 'array', items: { type: 'object' } },
              lastUpdated: { type: 'string', format: 'date-time' },
              systemHealth: { type: 'object' }
            }
          },
          metadata: {
            type: 'object',
            properties: {
              cacheStatus: { type: 'string', enum: ['live', 'cached'] },
              nextUpdate: { type: 'string', format: 'date-time' },
              dataFreshness: { type: 'number' }
            }
          }
        }
      },
      LeadOrchestrationRequest: {
        type: 'object',
        required: ['leadData', 'behaviorContext', 'sourceMetadata'],
        properties: {
          leadData: { type: 'object' },
          behaviorContext: { type: 'object' },
          sourceMetadata: { type: 'object' }
        }
      },
      LeadOrchestrationResponse: {
        type: 'object',
        required: ['success', 'leadId', 'leadScore', 'routingDecision'],
        properties: {
          success: { type: 'boolean', example: true },
          leadId: { type: 'string', format: 'uuid' },
          leadScore: { type: 'integer', minimum: 0 },
          routingDecision: { type: 'object' },
          automatedActions: { type: 'array', items: { type: 'object' } },
          nextSteps: { type: 'array', items: { type: 'object' } }
        }
      },
      LeadsListResponse: {
        type: 'object',
        required: ['success', 'data', 'pagination'],
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { type: 'object' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Operational Status',
      description: 'Real-time operational status and metrics management'
    },
    {
      name: 'Lead Management',
      description: 'Intelligent lead orchestration and management system'
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints requiring authentication'
    }
  ]
};

export type OpenAPISpec = typeof openApiSpec;