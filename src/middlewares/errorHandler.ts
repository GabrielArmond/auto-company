import type { ErrorRequestHandler } from 'express';
import { config } from '../config';

// O Express identifica o handler de erro pela aridade (4 parâmetros), por isso o _next.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status: number = typeof err?.status === 'number' ? err.status : 500;
  const body: { error: string; details?: string[] } = {
    error: status >= 500 && config.env === 'production' ? 'Internal Server Error' : err.message,
  };

  if (err?.details) body.details = err.details;
  if (status >= 500) console.error(err);

  res.status(status).json(body);
};
