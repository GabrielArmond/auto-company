import type { RequestHandler } from 'express';
import { HttpError } from '../utils/HttpError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Rota ${req.method} ${req.originalUrl} não encontrada`));
};
