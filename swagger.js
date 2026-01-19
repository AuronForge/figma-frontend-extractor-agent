import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Figma Frontend Extractor Agent API',
      version: '1.0.0',
      description:
        'API for extracting Figma designs and converting them into frontend code skeletons. Supports multiple AI providers (OpenAI, GitHub Models, Anthropic) to analyze design components and generate React/Vue/Angular/HTML boilerplate code.',
      contact: {
        name: 'API Support',
        url: 'https://github.com/AuronForge/figma-frontend-extractor-agent',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3003/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://figma-frontend-extractor-agent.vercel.app/api/v1',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Design Extraction',
        description: 'Endpoints for extracting Figma designs',
      },
      {
        name: 'Code Generation',
        description: 'Endpoints for generating frontend code',
      },
    ],
    components: {
      schemas: {
        FigmaExtractRequest: {
          type: 'object',
          required: ['fileKey', 'framework'],
          properties: {
            fileKey: {
              type: 'string',
              description: 'Figma file key from URL',
              example: 'abc123xyz789',
            },
            nodeId: {
              type: 'string',
              description: 'Specific node ID to extract (optional)',
              example: '15:234',
            },
            framework: {
              type: 'string',
              enum: ['react', 'vue', 'angular', 'html'],
              description: 'Target frontend framework',
              example: 'react',
            },
            componentName: {
              type: 'string',
              description: 'Name for the generated component',
              example: 'LoginForm',
            },
            options: {
              type: 'object',
              properties: {
                includeStyles: {
                  type: 'boolean',
                  default: true,
                },
                cssFramework: {
                  type: 'string',
                  enum: ['css', 'tailwind', 'styled-components'],
                  default: 'css',
                },
                responsive: {
                  type: 'boolean',
                  default: true,
                },
                typescript: {
                  type: 'boolean',
                  default: false,
                },
              },
            },
          },
        },
        GenerateCodeRequest: {
          type: 'object',
          required: ['fileKey', 'framework'],
          properties: {
            fileKey: {
              type: 'string',
              description: 'Figma file key',
              example: 'abc123xyz789',
            },
            framework: {
              type: 'string',
              enum: ['react', 'vue', 'angular', 'html'],
              example: 'react',
            },
            pageId: {
              type: 'string',
              description: 'Page ID to generate',
              example: '1:2',
            },
            options: {
              type: 'object',
              properties: {
                typescript: {
                  type: 'boolean',
                  default: false,
                },
                includeStyles: {
                  type: 'boolean',
                  default: true,
                },
                responsive: {
                  type: 'boolean',
                  default: true,
                },
              },
            },
          },
        },
        ExtractResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            data: {
              type: 'object',
              properties: {
                framework: {
                  type: 'string',
                  example: 'react',
                },
                components: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        example: 'LoginForm',
                      },
                      code: {
                        type: 'string',
                        example: "import React from 'react'...",
                      },
                      styles: {
                        type: 'string',
                        example: '.login-form { ... }',
                      },
                      dependencies: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                        example: ['useState', 'useEffect'],
                      },
                    },
                  },
                },
                assets: {
                  type: 'object',
                  properties: {
                    images: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                      example: ['logo.svg', 'background.png'],
                    },
                    fonts: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                      example: ['Inter', 'Roboto'],
                    },
                  },
                },
              },
            },
            metadata: {
              type: 'object',
              properties: {
                figmaFile: {
                  type: 'string',
                  example: 'abc123xyz789',
                },
                provider: {
                  type: 'string',
                  example: 'github',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-01-19T10:30:00.000Z',
                },
              },
            },
            savedTo: {
              type: 'string',
              example: 'figma-extract-loginform.json',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
      parameters: {
        AIProvider: {
          name: 'x-ai-provider',
          in: 'header',
          description: 'AI Provider to use for code generation',
          required: false,
          schema: {
            type: 'string',
            enum: ['openai', 'github', 'anthropic'],
            default: 'github',
          },
        },
        CodeId: {
          name: 'id',
          in: 'query',
          description: 'Generated code entry ID',
          required: false,
          schema: {
            type: 'string',
          },
        },
      },
    },
  },
  apis: ['./api/v1/*.js', './src/**/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
