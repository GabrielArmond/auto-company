import type { Request, Response } from 'express';
import type { AutomovelService } from '../services/automovelService';

// Query strings podem chegar como array (?cor=a&cor=b); consideramos só valores simples.
function queryString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function createAutomovelController(automovelService: AutomovelService) {
  return {
    async list(req: Request, res: Response) {
      const cor = queryString(req.query.cor);
      const marca = queryString(req.query.marca);
      res.json(await automovelService.list({ cor, marca }));
    },

    async getById(req: Request<{ id: string }>, res: Response) {
      res.json(await automovelService.getById(req.params.id));
    },

    async create(req: Request, res: Response) {
      res.status(201).json(await automovelService.create(req.body));
    },

    async update(req: Request<{ id: string }>, res: Response) {
      res.json(await automovelService.update(req.params.id, req.body));
    },

    async remove(req: Request<{ id: string }>, res: Response) {
      await automovelService.remove(req.params.id);
      res.status(204).end();
    },
  };
}
