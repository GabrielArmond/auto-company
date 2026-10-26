import type { OpenAPIV3 } from 'openapi-types';

const errorResponse = (description: string): OpenAPIV3.ResponseObject => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const idParam: OpenAPIV3.ParameterObject = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: 'Vehicle id',
};

const vehicleBody: OpenAPIV3.RequestBodyObject = {
  required: true,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/VehicleInput' } } },
};

const vehicleResponse = (description: string): OpenAPIV3.ResponseObject => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } },
});

export const openApiDocument: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Auto-company API',
    version: '1.0.0',
    description: "Web API to manage the usage of a company's vehicles.",
  },
  // Relative URL so "Try it out" calls the same host serving the docs.
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Health', description: 'Service status' },
    { name: 'Vehicles', description: 'Vehicle registry' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'number', example: 12.34 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/vehicles': {
      get: {
        tags: ['Vehicles'],
        summary: 'List vehicles',
        description: 'Filters match the exact value (case-sensitive) and can be combined.',
        parameters: [
          { name: 'color', in: 'query', schema: { type: 'string' }, example: 'Black' },
          { name: 'brand', in: 'query', schema: { type: 'string' }, example: 'Fiat' },
        ],
        responses: {
          200: {
            description: 'Vehicles found',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Vehicles'],
        summary: 'Create a vehicle',
        requestBody: vehicleBody,
        responses: {
          201: vehicleResponse('Vehicle created'),
          400: errorResponse('Invalid data'),
          409: errorResponse('Plate already registered'),
        },
      },
    },
    '/vehicles/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Vehicles'],
        summary: 'Get a vehicle by id',
        responses: {
          200: vehicleResponse('Vehicle found'),
          404: errorResponse('Vehicle not found'),
        },
      },
      put: {
        tags: ['Vehicles'],
        summary: 'Update a vehicle',
        description: 'Replaces all fields; every field is required.',
        requestBody: vehicleBody,
        responses: {
          200: vehicleResponse('Vehicle updated'),
          400: errorResponse('Invalid data'),
          404: errorResponse('Vehicle not found'),
          409: errorResponse('Plate already registered'),
        },
      },
      delete: {
        tags: ['Vehicles'],
        summary: 'Delete a vehicle',
        responses: {
          204: { description: 'Vehicle deleted' },
          404: errorResponse('Vehicle not found'),
        },
      },
    },
  },
  components: {
    schemas: {
      VehicleInput: {
        type: 'object',
        required: ['plate', 'color', 'brand'],
        properties: {
          plate: {
            type: 'string',
            description: 'Legacy (ABC1234) or Mercosur (ABC1D23) format; hyphens/spaces and case are normalized.',
            example: 'ABC1D23',
          },
          color: { type: 'string', example: 'Black' },
          brand: { type: 'string', example: 'Fiat' },
        },
      },
      Vehicle: {
        allOf: [
          { type: 'object', required: ['id'], properties: { id: { type: 'string', example: 'q8Zt1nV3kXyP' } } },
          { $ref: '#/components/schemas/VehicleInput' },
          {
            type: 'object',
            required: ['createdAt', 'updatedAt'],
            properties: {
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'Invalid data' },
          details: {
            type: 'array',
            items: { type: 'string' },
            example: ['The "plate" field is required'],
          },
        },
      },
    },
  },
};
