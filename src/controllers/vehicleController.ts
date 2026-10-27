import type { Request, Response } from 'express';
import type { VehicleService } from '../services/vehicleService';
import { queryString } from '../utils/queryString';

export function createVehicleController(vehicleService: VehicleService) {
  return {
    async list(req: Request, res: Response) {
      const color = queryString(req.query.color);
      const brand = queryString(req.query.brand);
      const pagination = { limit: queryString(req.query.limit), cursor: queryString(req.query.cursor) };
      res.json(await vehicleService.list({ color, brand }, pagination));
    },

    async getById(req: Request<{ id: string }>, res: Response) {
      res.json(await vehicleService.getById(req.params.id));
    },

    async getByLicensePlate(req: Request<{ plate: string }>, res: Response) {
      res.json(await vehicleService.getByLicensePlate(req.params.plate));
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
