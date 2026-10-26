import type { VehicleInput } from '../models/vehicle';
import { HttpError } from '../utils/HttpError';
import { asRecord, requiredString } from './common';

// Accepts the legacy Brazilian format (ABC1234) and the Mercosur format (ABC1D23).
const PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;

export function normalizePlate(plate: unknown): unknown {
  return typeof plate === 'string' ? plate.replace(/[\s-]/g, '').toUpperCase() : plate;
}

export function validateVehicle(body: unknown): VehicleInput {
  const data = asRecord(body);
  const errors: string[] = [];

  const plate = requiredString(normalizePlate(data.plate), 'plate', errors);
  if (plate && !PLATE_REGEX.test(plate)) {
    errors.push('The "plate" field must match the format ABC1234 or ABC1D23');
  }

  const color = requiredString(data.color, 'color', errors);
  const brand = requiredString(data.brand, 'brand', errors);

  if (errors.length) throw HttpError.badRequest('Invalid data', errors);

  return { plate, color, brand };
}
