import type { OpenAPIV3 } from 'openapi-types';
import { API_KEY_HEADER } from '../middlewares/requireApiKey';
import { ID_PATTERN } from '../utils/isValidId';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../validators/paginationValidator';
import { MAX_BRAND_LENGTH, MAX_COLOR_LENGTH } from '../validators/vehicleValidator';

const ref = (schema: string): OpenAPIV3.ReferenceObject => ({ $ref: `#/components/schemas/${schema}` });

const jsonResponse = (
  description: string,
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
): OpenAPIV3.ResponseObject => ({
  description,
  content: { 'application/json': { schema } },
});

const errorResponse = (description: string) => jsonResponse(description, ref('Error'));

const unauthorized = errorResponse('Missing or invalid API key');
const tooManyRequests = errorResponse('Too many requests; retry after the time in the Retry-After header');

const jsonBody = (schema: string): OpenAPIV3.RequestBodyObject => ({
  required: true,
  content: { 'application/json': { schema: ref(schema) } },
});

const idSchema: OpenAPIV3.SchemaObject = { type: 'string', pattern: ID_PATTERN };

const paginationParams: OpenAPIV3.ParameterObject[] = [
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE },
    description: 'Page size',
  },
  {
    name: 'cursor',
    in: 'query',
    schema: { type: 'string', pattern: ID_PATTERN },
    description: 'nextCursor returned by the previous page; omit it to get the first page',
  },
];

const pageResponse = (description: string, itemSchema: string) =>
  jsonResponse(description, {
    type: 'object',
    required: ['data', 'nextCursor'],
    properties: {
      data: { type: 'array', items: ref(itemSchema) },
      nextCursor: {
        type: 'string',
        nullable: true,
        description: 'Pass it as ?cursor= to get the next page; null on the last page.',
      },
    },
  });

const idParam = (resource: string): OpenAPIV3.ParameterObject => ({
  name: 'id',
  in: 'path',
  required: true,
  schema: idSchema,
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
    description:
      "Web API to manage the usage of a company's vehicles. " +
      'Every route except /health requires the API key in the X-API-Key header (use the Authorize button). ' +
      'Requests are rate limited per client IP; lists are paginated with ?limit= and ?cursor=.',
  },
  // Relative URL so "Try it out" calls the same host serving the docs.
  servers: [{ url: '/api' }],
  security: [{ ApiKeyAuth: [] }],
  tags: [
    { name: 'Health', description: 'Service status' },
    { name: 'Vehicles', description: 'Vehicle registry' },
    { name: 'Drivers', description: 'Driver registry' },
    {
      name: 'Vehicle usages',
      description:
        'Usage of a vehicle by a driver. A vehicle can be used by one driver at a time, ' +
        'and a driver can use only one vehicle at a time.',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
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
        description: 'Filters match the whole value, ignoring case, and can be combined. Ordered by id.',
        parameters: [
          { name: 'color', in: 'query', schema: { type: 'string' }, example: 'Black' },
          { name: 'brand', in: 'query', schema: { type: 'string' }, example: 'Fiat' },
          ...paginationParams,
        ],
        responses: {
          200: pageResponse('Vehicles found', 'Vehicle'),
          400: errorResponse('Invalid query parameters'),
          401: unauthorized,
          429: tooManyRequests,
        },
      },
      post: {
        tags: ['Vehicles'],
        summary: 'Create a vehicle',
        requestBody: jsonBody('VehicleInput'),
        responses: {
          201: jsonResponse('Vehicle created', ref('Vehicle')),
          400: errorResponse('Invalid data'),
          401: unauthorized,
          409: errorResponse('Plate already registered'),
          429: tooManyRequests,
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
          401: unauthorized,
          404: errorResponse('Vehicle not found'),
          429: tooManyRequests,
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
          401: unauthorized,
          404: errorResponse('Vehicle not found'),
          409: errorResponse('Plate already registered'),
          429: tooManyRequests,
        },
      },
      delete: {
        tags: ['Vehicles'],
        summary: 'Delete a vehicle',
        responses: {
          204: { description: 'Vehicle deleted' },
          401: unauthorized,
          404: errorResponse('Vehicle not found'),
          409: errorResponse('Vehicle is in use'),
          429: tooManyRequests,
        },
      },
    },
    '/vehicles/plate/{plate}': {
      parameters: [
        {
          name: 'plate',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: 'ABC1D23',
          description: 'Legacy (ABC1234) or Mercosur (ABC1D23) format; hyphens/spaces and case are ignored.',
        },
      ],
      get: {
        tags: ['Vehicles'],
        summary: 'Get a vehicle by plate',
        responses: {
          200: jsonResponse('Vehicle found', ref('Vehicle')),
          401: unauthorized,
          404: errorResponse('Vehicle not found'),
          429: tooManyRequests,
        },
      },
    },
    '/drivers': {
      get: {
        tags: ['Drivers'],
        summary: 'List drivers',
        description:
          'The name filter ignores case and accents and matches the start of any word: ' +
          '"joao", "silva" and "jo sil" all find "João da Silva". Ordered by id.',
        parameters: [{ name: 'name', in: 'query', schema: { type: 'string' }, example: 'joao' }, ...paginationParams],
        responses: {
          200: pageResponse('Drivers found', 'Driver'),
          400: errorResponse('Invalid query parameters'),
          401: unauthorized,
          429: tooManyRequests,
        },
      },
      post: {
        tags: ['Drivers'],
        summary: 'Create a driver',
        requestBody: jsonBody('DriverInput'),
        responses: {
          201: jsonResponse('Driver created', ref('Driver')),
          400: errorResponse('Invalid data'),
          401: unauthorized,
          429: tooManyRequests,
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
          401: unauthorized,
          404: errorResponse('Driver not found'),
          429: tooManyRequests,
        },
      },
      put: {
        tags: ['Drivers'],
        summary: 'Update a driver',
        requestBody: jsonBody('DriverInput'),
        responses: {
          200: jsonResponse('Driver updated', ref('Driver')),
          400: errorResponse('Invalid data'),
          401: unauthorized,
          404: errorResponse('Driver not found'),
          429: tooManyRequests,
        },
      },
      delete: {
        tags: ['Drivers'],
        summary: 'Delete a driver',
        responses: {
          204: { description: 'Driver deleted' },
          401: unauthorized,
          404: errorResponse('Driver not found'),
          409: errorResponse('Driver is using a vehicle'),
          429: tooManyRequests,
        },
      },
    },
    '/vehicle-usages': {
      get: {
        tags: ['Vehicle usages'],
        summary: 'List vehicle usages',
        description: 'Most recent first, with the driver name and the vehicle information.',
        parameters: paginationParams,
        responses: {
          200: pageResponse('Vehicle usages found', 'VehicleUsage'),
          400: errorResponse('Invalid query parameters'),
          401: unauthorized,
          429: tooManyRequests,
        },
      },
      post: {
        tags: ['Vehicle usages'],
        summary: 'Start a vehicle usage',
        requestBody: jsonBody('VehicleUsageStartInput'),
        responses: {
          201: jsonResponse('Vehicle usage started', ref('VehicleUsage')),
          400: errorResponse('Invalid data'),
          401: unauthorized,
          404: errorResponse('Vehicle or driver not found'),
          409: errorResponse(
            'Vehicle already in use, driver already using another vehicle, ' +
              'or start date before the end of their last usage',
          ),
          429: tooManyRequests,
        },
      },
    },
    '/vehicle-usages/{id}': {
      parameters: [idParam('Vehicle usage')],
      get: {
        tags: ['Vehicle usages'],
        summary: 'Get a vehicle usage by id',
        responses: {
          200: jsonResponse('Vehicle usage found', ref('VehicleUsage')),
          401: unauthorized,
          404: errorResponse('Vehicle usage not found'),
          429: tooManyRequests,
        },
      },
    },
    '/vehicle-usages/{id}/finish': {
      parameters: [idParam('Vehicle usage')],
      patch: {
        tags: ['Vehicle usages'],
        summary: 'Finish a vehicle usage',
        requestBody: {
          required: false,
          content: { 'application/json': { schema: ref('VehicleUsageFinishInput') } },
        },
        responses: {
          200: jsonResponse('Vehicle usage finished', ref('VehicleUsage')),
          400: errorResponse('Invalid data'),
          401: unauthorized,
          404: errorResponse('Vehicle usage not found'),
          409: errorResponse('Vehicle usage already finished'),
          429: tooManyRequests,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: API_KEY_HEADER },
    },
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
          color: { type: 'string', maxLength: MAX_COLOR_LENGTH, example: 'Black' },
          brand: { type: 'string', maxLength: MAX_BRAND_LENGTH, example: 'Fiat' },
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
      VehicleUsageStartInput: {
        type: 'object',
        required: ['driverId', 'vehicleId', 'reason'],
        properties: {
          driverId: { ...idSchema, example: 'q8Zt1nV3kXyP' },
          vehicleId: { ...idSchema, example: 'b2Lm9cR4wQeT' },
          reason: { type: 'string', maxLength: 500, example: 'Client visit downtown' },
          startDate: {
            type: 'string',
            format: 'date-time',
            description:
              'Defaults to now; cannot be in the future nor before the end of the last usage ' +
              'of the same vehicle or driver.',
          },
        },
      },
      VehicleUsageFinishInput: {
        type: 'object',
        properties: {
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Defaults to now; cannot be in the future nor before the start date.',
          },
        },
      },
      VehicleUsage: {
        type: 'object',
        required: ['id', 'driver', 'vehicle', 'reason', 'startDate', 'endDate', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', example: 'x7Hk2pD9sLmN' },
          driver: {
            type: 'object',
            description: 'Driver data at the time of the usage.',
            properties: {
              id: { type: 'string', example: 'q8Zt1nV3kXyP' },
              name: { type: 'string', example: 'João da Silva' },
            },
          },
          vehicle: {
            type: 'object',
            description: 'Vehicle data at the time of the usage.',
            properties: {
              id: { type: 'string', example: 'b2Lm9cR4wQeT' },
              plate: { type: 'string', example: 'ABC1D23' },
              color: { type: 'string', example: 'Black' },
              brand: { type: 'string', example: 'Fiat' },
            },
          },
          reason: { type: 'string', example: 'Client visit downtown' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time', nullable: true, description: 'null while in use.' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
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
