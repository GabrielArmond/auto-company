import { Router } from 'express';
import { createVehicleController } from '../controllers/vehicleController';
import type { VehicleService } from '../services/vehicleService';

export function vehiclesRouter(vehicleService: VehicleService) {
  const router = Router();
  const controller = createVehicleController(vehicleService);

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.get('/plate/:plate', controller.getByLicensePlate);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
