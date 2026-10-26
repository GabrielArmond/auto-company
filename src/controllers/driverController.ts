import type { Request, Response } from 'express';
import type { DriverService } from '../services/driverService';
import { queryString } from '../utils/queryString';

export function createDriverController(driverService: DriverService) {
  return {
    async list(req: Request, res: Response) {
      res.json(await driverService.list({ name: queryString(req.query.name) }));
    },

    async getById(req: Request<{ id: string }>, res: Response) {
      res.json(await driverService.getById(req.params.id));
    },

    async create(req: Request, res: Response) {
      res.status(201).json(await driverService.create(req.body));
    },

    async update(req: Request<{ id: string }>, res: Response) {
      res.json(await driverService.update(req.params.id, req.body));
    },

    async remove(req: Request<{ id: string }>, res: Response) {
      await driverService.remove(req.params.id);
      res.status(204).end();
    },
  };
}
