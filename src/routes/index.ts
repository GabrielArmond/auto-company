import { Router } from 'express';
import { createRateLimiter, type RateLimitOptions } from '../middlewares/rateLimiter';
import { requireApiKey } from '../middlewares/requireApiKey';
import type { Services } from '../services';
import { driversRouter } from './drivers';
import { vehiclesRouter } from './vehicles';
import { vehicleUsagesRouter } from './vehicleUsages';

interface ApiRouterOptions {
  apiKeys: string[];
  rateLimit: RateLimitOptions;
}

export function apiRouter(
  { vehicleService, driverService, vehicleUsageService }: Services,
  { apiKeys, rateLimit }: ApiRouterOptions,
) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  router.use(createRateLimiter(rateLimit));
  router.use(requireApiKey(apiKeys));

  router.use('/vehicles', vehiclesRouter(vehicleService));
  router.use('/drivers', driversRouter(driverService));
  router.use('/vehicle-usages', vehicleUsagesRouter(vehicleUsageService));

  return router;
}
