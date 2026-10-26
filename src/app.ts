import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import { apiRouter } from './routes';
import type { Services } from './services';

// Recebe os services prontos (ver container.ts), o que permite injetar dublês nos testes.
export function createApp(services: Services) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  if (config.env !== 'test') app.use(morgan('dev'));

  app.use('/api', apiRouter(services));

  // Frontend estático (opcional): coloque o build em /public
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
