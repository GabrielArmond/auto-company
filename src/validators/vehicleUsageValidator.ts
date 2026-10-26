import { HttpError } from '../utils/HttpError';
import { asRecord, requiredString } from './common';

export const MAX_REASON_LENGTH = 500;

export interface VehicleUsageStart {
  driverId: string;
  vehicleId: string;
  reason: string;
  startDate: Date;
}

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

export function validateUsageStart(body: unknown, now: Date): VehicleUsageStart {
  const data = asRecord(body);
  const errors: string[] = [];

  const driverId = requiredString(data.driverId, 'driverId', errors);
  const vehicleId = requiredString(data.vehicleId, 'vehicleId', errors);

  const reason = requiredString(data.reason, 'reason', errors);
  if (reason.length > MAX_REASON_LENGTH) {
    errors.push(`The "reason" field must have at most ${MAX_REASON_LENGTH} characters`);
  }

  const startDate = optionalPastDate(data.startDate, 'startDate', now, errors);

  if (errors.length) throw HttpError.badRequest('Invalid data', errors);

  return { driverId, vehicleId, reason, startDate: startDate ?? now };
}

export function validateUsageFinish(body: unknown, startDate: Date, now: Date): Date {
  const errors: string[] = [];

  const endDate = optionalPastDate(asRecord(body).endDate, 'endDate', now, errors) ?? now;
  if (!errors.length && endDate < startDate) {
    errors.push('The "endDate" field cannot be before the usage start date');
  }

  if (errors.length) throw HttpError.badRequest('Invalid data', errors);

  return endDate;
}
