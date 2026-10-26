import type { Request, Response } from 'express';
import type { VehicleService } from '../services/vehicleService';
import { queryString } from '../utils/queryString';

export function createVehicleController(vehicleService: VehicleService) {
  return {
    async list(req: Request, res: Response) {
      const color = queryString(req.query.color);
      const brand = queryString(req.query.brand);
      res.json(await vehicleService.list({ color, brand }));
    },

    async getById(req: Request<{ id: string }>, res: Response) {
      res.json(await vehicleService.getById(req.params.id));
    },

    async create(req: Request, res: Response) {
      res.status(201).json(await vehicleService.create(req.body));
    },

    async update(req: Request<{ id: string }>, res: Response) {
      res.json(await vehicleService.update(req.params.id, req.body));
    },

    async remove(req: Request<{ id: string }>, res: Response) {
      await vehicleService.remove(req.params.id);
      res.status(204).end();
    },
  };
}
