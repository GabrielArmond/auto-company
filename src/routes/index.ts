import { Router } from 'express';
import type { Services } from '../services';
import { automoveisRouter } from './automoveis';

export function apiRouter({ automovelService }: Services) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  router.use('/automoveis', automoveisRouter(automovelService));

  return router;
}
