import {
  MAX_BRAND_LENGTH,
  MAX_COLOR_LENGTH,
  normalizePlate,
  validateVehicle,
} from '../../src/validators/vehicleValidator';

describe('vehicleValidator', () => {
  describe('normalizePlate', () => {
    it('removes hyphens/spaces and converts to uppercase', () => {
      expect(normalizePlate('abc-1234')).toBe('ABC1234');
      expect(normalizePlate(' abc 1d23 ')).toBe('ABC1D23');
    });
  });

  describe('validateVehicle', () => {
    it.each(['ABC1234', 'ABC1D23', 'abc-1234'])('accepts plate %s', (plate) => {
      expect(() => validateVehicle({ plate, color: 'Black', brand: 'Fiat' })).not.toThrow();
    });

    it('returns normalized data and drops extra fields', () => {
      expect(validateVehicle({ plate: 'abc-1d23', color: ' Black ', brand: ' Fiat ', extra: 1 })).toEqual({
        plate: 'ABC1D23',
        color: 'Black',
        brand: 'Fiat',
      });
    });

    it('lists every missing required field', () => {
      expect(() => validateVehicle({})).toThrow(
        expect.objectContaining({
          status: 400,
          details: [
            'The "plate" field is required',
            'The "color" field is required',
            'The "brand" field is required',
          ],
        }),
      );
    });

    it.each(['AB12345', 'ABCD123', '1234ABC', 'ABC12'])('rejects invalid plate %s', (plate) => {
      expect(() => validateVehicle({ plate, color: 'Black', brand: 'Fiat' })).toThrow(
        expect.objectContaining({ status: 400 }),
      );
    });

    it('accepts color and brand up to the maximum length', () => {
      const vehicle = { plate: 'ABC1234', color: 'c'.repeat(MAX_COLOR_LENGTH), brand: 'b'.repeat(MAX_BRAND_LENGTH) };
      expect(() => validateVehicle(vehicle)).not.toThrow();
    });

    it('rejects color and brand over the maximum length', () => {
      const vehicle = {
        plate: 'ABC1234',
        color: 'c'.repeat(MAX_COLOR_LENGTH + 1),
        brand: 'b'.repeat(MAX_BRAND_LENGTH + 1),
      };

      expect(() => validateVehicle(vehicle)).toThrow(
        expect.objectContaining({
          status: 400,
          details: [
            `The "color" field must have at most ${MAX_COLOR_LENGTH} characters`,
            `The "brand" field must have at most ${MAX_BRAND_LENGTH} characters`,
          ],
        }),
      );
    });

    it.each([undefined, null, 'text', 42])('treats body %p as empty', (body) => {
      expect(() => validateVehicle(body)).toThrow(expect.objectContaining({ status: 400 }));
    });
  });
});
