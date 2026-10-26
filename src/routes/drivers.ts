import { Router } from 'express';
import { createDriverController } from '../controllers/driverController';
import type { DriverService } from '../services/driverService';

export function driversRouter(driverService: DriverService) {
  const router = Router();
  const controller = createDriverController(driverService);

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
