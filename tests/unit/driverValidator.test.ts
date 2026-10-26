import { MAX_NAME_LENGTH, validateDriver } from '../../src/validators/driverValidator';

describe('driverValidator', () => {
  it('returns the trimmed name with collapsed spaces and drops extra fields', () => {
    expect(validateDriver({ name: '  João   da  Silva ', extra: 1 })).toEqual({ name: 'João da Silva' });
  });

  it.each([{}, { name: '' }, { name: '   ' }, { name: 42 }])('requires the name (%p)', (body) => {
    expect(() => validateDriver(body)).toThrow(
      expect.objectContaining({ status: 400, details: ['The "name" field is required'] }),
    );
  });

  it(`accepts names up to ${MAX_NAME_LENGTH} characters`, () => {
    expect(() => validateDriver({ name: 'a'.repeat(MAX_NAME_LENGTH) })).not.toThrow();
  });

  it(`rejects names longer than ${MAX_NAME_LENGTH} characters`, () => {
    expect(() => validateDriver({ name: 'a'.repeat(MAX_NAME_LENGTH + 1) })).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  it.each([undefined, null, 'text'])('treats body %p as empty', (body) => {
    expect(() => validateDriver(body)).toThrow(expect.objectContaining({ status: 400 }));
  });
});
