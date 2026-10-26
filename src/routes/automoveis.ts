import { Router } from 'express';
import { createAutomovelController } from '../controllers/automovelController';
import type { AutomovelService } from '../services/automovelService';

export function automoveisRouter(automovelService: AutomovelService) {
  const router = Router();
  const controller = createAutomovelController(automovelService);

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
