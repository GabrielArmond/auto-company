import { HttpError } from '../utils/HttpError';
import { asRecord, requiredId, requiredString } from './common';

export const MAX_REASON_LENGTH = 500;

export interface VehicleUsageStart {
  driverId: string;
  vehicleId: string;
  reason: string;
  startDate: Date;
}

// Parses an optional ISO 8601 date string ('2026-01-01T08:00:00Z' -> Date). Missing or null -> undefined,
// so the caller can default to now. Non-strings, invalid dates and dates after now add an error instead.
function optionalPastDate(value: unknown, field: string, now: Date, errors: string[]): Date | undefined {
  if (value === undefined || value === null) return undefined;

  const date = typeof value === 'string' ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) {
    errors.push(`The "${field}" field must be a valid ISO 8601 date`);
    return undefined;
  }
  if (date > now) {
    errors.push(`The "${field}" field cannot be in the future`);
    return undefined;
  }
  return date;
}

// Parses the body that starts a usage: driverId and vehicleId must be valid ids, reason is trimmed and
// startDate defaults to now. Other fields are dropped. Throws 400 with every problem found in details.
export function validateUsageStart(body: unknown, now: Date): VehicleUsageStart {
  const data = asRecord(body);
  const errors: string[] = [];

  const driverId = requiredId(data.driverId, 'driverId', errors);
  const vehicleId = requiredId(data.vehicleId, 'vehicleId', errors);

  const reason = requiredString(data.reason, 'reason', errors);
  if (reason.length > MAX_REASON_LENGTH) {
    errors.push(`The "reason" field must have at most ${MAX_REASON_LENGTH} characters`);
  }

  const startDate = optionalPastDate(data.startDate, 'startDate', now, errors);

  if (errors.length) throw HttpError.badRequest('Invalid data', errors);

  return { driverId, vehicleId, reason, startDate: startDate ?? now };
}

// Parses the body that finishes a usage into its end date: defaults to now, cannot be in the future nor
// before the start date. Throws 400 with the problem in details.
export function validateUsageFinish(body: unknown, startDate: Date, now: Date): Date {
  const errors: string[] = [];

  const endDate = optionalPastDate(asRecord(body).endDate, 'endDate', now, errors) ?? now;
  if (!errors.length && endDate < startDate) {
    errors.push('The "endDate" field cannot be before the usage start date');
  }

  if (errors.length) throw HttpError.badRequest('Invalid data', errors);

  return endDate;
}
