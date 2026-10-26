import type { OpenAPIV3 } from 'openapi-types';

const ref = (schema: string): OpenAPIV3.ReferenceObject => ({ $ref: `#/components/schemas/${schema}` });

const jsonResponse = (
  description: string,
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
): OpenAPIV3.ResponseObject => ({
  description,
  content: { 'application/json': { schema } },
});

const errorResponse = (description: string) => jsonResponse(description, ref('Error'));

const jsonBody = (schema: string): OpenAPIV3.RequestBodyObject => ({
  required: true,
  content: { 'application/json': { schema: ref(schema) } },
});

const idParam = (resource: string): OpenAPIV3.ParameterObject => ({
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
  description: `${resource} id`,
});

// Stored entity = id + input fields + timestamps.
const entitySchema = (inputSchema: string): OpenAPIV3.SchemaObject => ({
  allOf: [
    { type: 'object', required: ['id'], properties: { id: { type: 'string', example: 'q8Zt1nV3kXyP' } } },
    ref(inputSchema),
    {
      type: 'object',
      required: ['createdAt', 'updatedAt'],
      properties: {
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  ],
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
    { name: 'Drivers', description: 'Driver registry' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: jsonResponse('Service is up', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              uptime: { type: 'number', example: 12.34 },
            },
          }),
        },
      },
    },
    '/vehicles': {
      get: {
        tags: ['Vehicles'],
        summary: 'List vehicles',
        description: 'Filters match the whole value, ignoring case, and can be combined.',
        parameters: [
          { name: 'color', in: 'query', schema: { type: 'string' }, example: 'Black' },
          { name: 'brand', in: 'query', schema: { type: 'string' }, example: 'Fiat' },
        ],
        responses: {
          200: jsonResponse('Vehicles found', { type: 'array', items: ref('Vehicle') }),
        },
      },
      post: {
        tags: ['Vehicles'],
        summary: 'Create a vehicle',
        requestBody: jsonBody('VehicleInput'),
        responses: {
          201: jsonResponse('Vehicle created', ref('Vehicle')),
          400: errorResponse('Invalid data'),
          409: errorResponse('Plate already registered'),
        },
      },
    },
    '/vehicles/{id}': {
      parameters: [idParam('Vehicle')],
      get: {
        tags: ['Vehicles'],
        summary: 'Get a vehicle by id',
        responses: {
          200: jsonResponse('Vehicle found', ref('Vehicle')),
          404: errorResponse('Vehicle not found'),
        },
      },
      put: {
        tags: ['Vehicles'],
        summary: 'Update a vehicle',
        description: 'Replaces all fields; every field is required.',
        requestBody: jsonBody('VehicleInput'),
        responses: {
          200: jsonResponse('Vehicle updated', ref('Vehicle')),
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
    '/drivers': {
      get: {
        tags: ['Drivers'],
        summary: 'List drivers',
        description:
          'The name filter ignores case and accents and matches the start of any word: ' +
          '"joao", "silva" and "jo sil" all find "João da Silva".',
        parameters: [{ name: 'name', in: 'query', schema: { type: 'string' }, example: 'joao' }],
        responses: {
          200: jsonResponse('Drivers found', { type: 'array', items: ref('Driver') }),
        },
      },
      post: {
        tags: ['Drivers'],
        summary: 'Create a driver',
        requestBody: jsonBody('DriverInput'),
        responses: {
          201: jsonResponse('Driver created', ref('Driver')),
          400: errorResponse('Invalid data'),
        },
      },
    },
    '/drivers/{id}': {
      parameters: [idParam('Driver')],
      get: {
        tags: ['Drivers'],
        summary: 'Get a driver by id',
        responses: {
          200: jsonResponse('Driver found', ref('Driver')),
          404: errorResponse('Driver not found'),
        },
      },
      put: {
        tags: ['Drivers'],
        summary: 'Update a driver',
        requestBody: jsonBody('DriverInput'),
        responses: {
          200: jsonResponse('Driver updated', ref('Driver')),
          400: errorResponse('Invalid data'),
          404: errorResponse('Driver not found'),
        },
      },
      delete: {
        tags: ['Drivers'],
        summary: 'Delete a driver',
        responses: {
          204: { description: 'Driver deleted' },
          404: errorResponse('Driver not found'),
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
      Vehicle: entitySchema('VehicleInput'),
      DriverInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', maxLength: 100, example: 'João da Silva' },
        },
      },
      Driver: entitySchema('DriverInput'),
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'Invalid data' },
          details: {
            type: 'array',
            items: { type: 'string' },
            example: ['The "name" field is required'],
          },
        },
      },
    },
  },
};
