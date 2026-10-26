import { Router } from 'express';
import type { Services } from '../services';
import { vehiclesRouter } from './vehicles';

export function apiRouter({ vehicleService }: Services) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  router.use('/vehicles', vehiclesRouter(vehicleService));

  return router;
}
