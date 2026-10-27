import type { VehicleInput } from '../models/vehicle';
import { HttpError } from '../utils/HttpError';
import { asRecord, requiredString } from './common';

export const MAX_COLOR_LENGTH = 50;
export const MAX_BRAND_LENGTH = 50;

// Accepts the legacy Brazilian format (ABC1234) and the Mercosur format (ABC1D23).
const PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;

// Normalizes a plate typed in any common way to the stored form, removing spaces and hyphens and
// uppercasing: 'abc-1d23' -> 'ABC1D23', ' abc 1234 ' -> 'ABC1234'. Non-strings are returned unchanged
// so the validator can report them as missing.
export function normalizePlate(plate: unknown): unknown {
  return typeof plate === 'string' ? plate.replace(/[\s-]/g, '').toUpperCase() : plate;
}

// Parses a request body into a VehicleInput: normalizes the plate, trims color and brand and drops any
// other field. Throws 400 with every problem found in details.
export function validateVehicle(body: unknown): VehicleInput {
  const data = asRecord(body);
  const errors: string[] = [];

  const plate = requiredString(normalizePlate(data.plate), 'plate', errors);
  if (plate && !PLATE_REGEX.test(plate)) {
    errors.push('The "plate" field must match the format ABC1234 or ABC1D23');
  }

  const color = requiredString(data.color, 'color', errors);
  if (color.length > MAX_COLOR_LENGTH) {
    errors.push(`The "color" field must have at most ${MAX_COLOR_LENGTH} characters`);
  }

  const brand = requiredString(data.brand, 'brand', errors);
  if (brand.length > MAX_BRAND_LENGTH) {
    errors.push(`The "brand" field must have at most ${MAX_BRAND_LENGTH} characters`);
  }

  if (errors.length) throw HttpError.badRequest('Invalid data', errors);

  return { plate, color, brand };
}
