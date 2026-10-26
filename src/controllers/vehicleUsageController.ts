import type { Request, Response } from 'express';
import type { VehicleUsageService } from '../services/vehicleUsageService';

export function createVehicleUsageController(vehicleUsageService: VehicleUsageService) {
  return {
    async list(_req: Request, res: Response) {
      res.json(await vehicleUsageService.list());
    },

    async getById(req: Request<{ id: string }>, res: Response) {
      res.json(await vehicleUsageService.getById(req.params.id));
    },

    async start(req: Request, res: Response) {
      res.status(201).json(await vehicleUsageService.start(req.body));
    },

    async finish(req: Request<{ id: string }>, res: Response) {
      res.json(await vehicleUsageService.finish(req.params.id, req.body));
    },
  };
}
