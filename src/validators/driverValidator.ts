import type { DriverInput } from '../models/driver';
import { HttpError } from '../utils/HttpError';
import { asRecord, requiredString } from './common';

export const MAX_NAME_LENGTH = 100;

// Parses a request body into a DriverInput: trims the name and collapses repeated whitespace
// ('  João   da Silva ' -> 'João da Silva'), dropping any other field. Throws 400 with the problems in details.
export function validateDriver(body: unknown): DriverInput {
  const data = asRecord(body);
  const errors: string[] = [];

  const name = requiredString(data.name, 'name', errors).replace(/\s+/g, ' ');
  if (name.length > MAX_NAME_LENGTH) {
    errors.push(`The "name" field must have at most ${MAX_NAME_LENGTH} characters`);
  }

  if (errors.length) throw HttpError.badRequest('Invalid data', errors);

  return { name };
}
