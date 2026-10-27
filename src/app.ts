import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { openApiDocument } from './docs/openapi';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import type { RateLimitOptions } from './middlewares/rateLimiter';
import { apiRouter } from './routes';
import type { Services } from './services';

interface AppOptions {
  apiKeys?: string[];
  rateLimit?: RateLimitOptions;
  trustProxy?: number;
}

// Receives ready-made services (see container.ts), which allows injecting test doubles.
export function createApp(
  services: Services,
  { apiKeys = config.apiKeys, rateLimit = config.rateLimit, trustProxy = config.trustProxy }: AppOptions = {},
) {
  const app = express();

  app.set('trust proxy', trustProxy);

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  if (config.env !== 'test') app.use(morgan('dev'));

  app.get('/api/docs.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, { swaggerOptions: { persistAuthorization: true } }),
  );

  app.use('/api', apiRouter(services, { apiKeys, rateLimit }));

  // Static frontend (optional): place the build in /public
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
