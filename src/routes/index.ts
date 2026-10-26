import { Router } from 'express';
import type { Services } from '../services';
import { driversRouter } from './drivers';
import { vehiclesRouter } from './vehicles';

export function apiRouter({ vehicleService, driverService }: Services) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  router.use('/vehicles', vehiclesRouter(vehicleService));
  router.use('/drivers', driversRouter(driverService));

  return router;
}
