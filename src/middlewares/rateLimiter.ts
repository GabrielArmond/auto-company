import { rateLimit } from 'express-rate-limit';
import { HttpError } from '../utils/HttpError';

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
}

export function createRateLimiter({ windowMs, limit }: RateLimitOptions) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(HttpError.tooManyRequests('Too many requests, please try again later')),
  });
}
