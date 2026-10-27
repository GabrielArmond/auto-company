import { STATUS_CODES } from 'node:http';
import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../utils/HttpError';

interface ErrorBody {
  error: string;
  details?: string[];
}

function toResponse(err: unknown): { status: number; body: ErrorBody } {
  if (err instanceof HttpError) {
    return { status: err.status, body: { error: err.message, ...(err.details && { details: err.details }) } };
  }

  const { status, type } = (err ?? {}) as { status?: unknown; type?: unknown };
  if (typeof status === 'number' && status >= 400 && status < 500) {
    const error = type === 'entity.parse.failed' ? 'Malformed JSON body' : (STATUS_CODES[status] ?? 'Bad Request');
    return { status, body: { error } };
  }

  return { status: 500, body: { error: 'Internal Server Error' } };
}

// Express detects error handlers by arity (4 parameters), hence the unused _next.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const { status, body } = toResponse(err);
  if (status >= 500) console.error(err);

  res.status(status).json(body);
};
