import { Router } from 'express';
import type { Services } from '../services';
import { driversRouter } from './drivers';
import { vehiclesRouter } from './vehicles';
import { vehicleUsagesRouter } from './vehicleUsages';

export function apiRouter({ vehicleService, driverService, vehicleUsageService }: Services) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  router.use('/vehicles', vehiclesRouter(vehicleService));
  router.use('/drivers', driversRouter(driverService));
  router.use('/vehicle-usages', vehicleUsagesRouter(vehicleUsageService));

  return router;
}
