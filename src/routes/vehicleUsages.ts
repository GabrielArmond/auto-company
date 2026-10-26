import { Router } from 'express';
import { createVehicleUsageController } from '../controllers/vehicleUsageController';
import type { VehicleUsageService } from '../services/vehicleUsageService';

export function vehicleUsagesRouter(vehicleUsageService: VehicleUsageService) {
  const router = Router();
  const controller = createVehicleUsageController(vehicleUsageService);

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.start);
  router.patch('/:id/finish', controller.finish);

  return router;
}
