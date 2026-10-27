import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { HttpError } from '../utils/HttpError';

export const API_KEY_HEADER = 'X-API-Key';
export const MIN_API_KEY_LENGTH = 32;

const hash = (value: string) => createHash('sha256').update(value).digest();

export function requireApiKey(apiKeys: string[]): RequestHandler {
  if (!apiKeys.length) {
    throw new Error('Missing API_KEYS environment variable');
  }
  if (apiKeys.some((key) => key.length < MIN_API_KEY_LENGTH)) {
    throw new Error(`Each API key must have at least ${MIN_API_KEY_LENGTH} characters`);
  }

  const hashedKeys = apiKeys.map(hash);

  return (req, _res, next) => {
    const provided = req.get(API_KEY_HEADER);
    const hashed = provided ? hash(provided) : null;

    if (hashed && hashedKeys.some((key) => timingSafeEqual(key, hashed))) return next();
    next(HttpError.unauthorized('Invalid or missing API key'));
  };
}
