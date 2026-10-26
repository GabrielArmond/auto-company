import {
  MAX_REASON_LENGTH,
  validateUsageFinish,
  validateUsageStart,
} from '../../src/validators/vehicleUsageValidator';

const now = new Date('2026-05-10T12:00:00Z');

describe('vehicleUsageValidator', () => {
  describe('validateUsageStart', () => {
    const valid = { driverId: 'd1', vehicleId: 'v1', reason: ' Client visit ' };

    it('returns the trimmed data and defaults startDate to now', () => {
      expect(validateUsageStart(valid, now)).toEqual({
        driverId: 'd1',
        vehicleId: 'v1',
        reason: 'Client visit',
        startDate: now,
      });
    });

    it('accepts a past startDate', () => {
      const result = validateUsageStart({ ...valid, startDate: '2026-05-10T08:30:00Z' }, now);
      expect(result.startDate).toEqual(new Date('2026-05-10T08:30:00Z'));
    });

    it('lists every missing required field', () => {
      expect(() => validateUsageStart({}, now)).toThrow(
        expect.objectContaining({
          status: 400,
          details: [
            'The "driverId" field is required',
            'The "vehicleId" field is required',
            'The "reason" field is required',
          ],
        }),
      );
    });

    it(`rejects a reason longer than ${MAX_REASON_LENGTH} characters`, () => {
      expect(() => validateUsageStart({ ...valid, reason: 'a'.repeat(MAX_REASON_LENGTH + 1) }, now)).toThrow(
        expect.objectContaining({ status: 400 }),
      );
    });

    it.each(['not-a-date', 123, '2026-13-45'])('rejects an invalid startDate (%p)', (startDate) => {
      expect(() => validateUsageStart({ ...valid, startDate }, now)).toThrow(
        expect.objectContaining({ details: ['The "startDate" field must be a valid ISO 8601 date'] }),
      );
    });

    it('rejects a startDate in the future', () => {
      expect(() => validateUsageStart({ ...valid, startDate: '2026-05-10T12:00:01Z' }, now)).toThrow(
        expect.objectContaining({ details: ['The "startDate" field cannot be in the future'] }),
      );
    });
  });

  describe('validateUsageFinish', () => {
    const startDate = new Date('2026-05-10T08:00:00Z');

    it.each([undefined, null, {}])('defaults endDate to now (body %p)', (body) => {
      expect(validateUsageFinish(body, startDate, now)).toEqual(now);
    });

    it('accepts an endDate between the start date and now', () => {
      expect(validateUsageFinish({ endDate: '2026-05-10T10:00:00Z' }, startDate, now)).toEqual(
        new Date('2026-05-10T10:00:00Z'),
      );
    });

    it('accepts an endDate equal to the start date', () => {
      expect(validateUsageFinish({ endDate: startDate.toISOString() }, startDate, now)).toEqual(startDate);
    });

    it('rejects an endDate before the start date', () => {
      expect(() => validateUsageFinish({ endDate: '2026-05-10T07:59:59Z' }, startDate, now)).toThrow(
        expect.objectContaining({ details: ['The "endDate" field cannot be before the usage start date'] }),
      );
    });

    it('rejects an endDate in the future', () => {
      expect(() => validateUsageFinish({ endDate: '2026-05-11T00:00:00Z' }, startDate, now)).toThrow(
        expect.objectContaining({ details: ['The "endDate" field cannot be in the future'] }),
      );
    });

    it('rejects an invalid endDate', () => {
      expect(() => validateUsageFinish({ endDate: 'tomorrow' }, startDate, now)).toThrow(
        expect.objectContaining({ status: 400 }),
      );
    });
  });
});
