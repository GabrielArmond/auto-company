import type { NextFunction, Request, Response } from 'express';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { HttpError } from '../../src/utils/HttpError';

function handle(err: unknown) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  errorHandler(err, {} as Request, res as unknown as Response, jest.fn() as NextFunction);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
}

describe('errorHandler', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('returns the status, message and details of an HttpError', () => {
    expect(handle(HttpError.badRequest('Invalid data', ['The "name" field is required']))).toEqual({
      status: 400,
      body: { error: 'Invalid data', details: ['The "name" field is required'] },
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('omits details when an HttpError has none', () => {
    expect(handle(HttpError.notFound('Vehicle not found')).body).toEqual({ error: 'Vehicle not found' });
  });

  it('hides the message and details of unexpected errors and logs them', () => {
    const err = Object.assign(new Error('7 PERMISSION_DENIED: projects/secret-project'), { details: ['internal'] });

    expect(handle(err)).toEqual({ status: 500, body: { error: 'Internal Server Error' } });
    expect(consoleError).toHaveBeenCalledWith(err);
  });

  it('hides the message of non-HttpErrors that carry a 5xx status', () => {
    expect(handle(Object.assign(new Error('upstream detail'), { status: 503 }))).toEqual({
      status: 500,
      body: { error: 'Internal Server Error' },
    });
  });

  it('keeps the status of client errors from other middlewares with a generic message', () => {
    const err = Object.assign(new Error('request entity too large: 204800 bytes'), {
      status: 413,
      type: 'entity.too.large',
    });

    expect(handle(err)).toEqual({ status: 413, body: { error: 'Payload Too Large' } });
  });

  it('reports malformed JSON bodies without the parser message', () => {
    const err = Object.assign(new SyntaxError('Unexpected end of JSON input'), {
      status: 400,
      type: 'entity.parse.failed',
    });

    expect(handle(err)).toEqual({ status: 400, body: { error: 'Malformed JSON body' } });
  });

  it.each([null, undefined, 'a string'])('handles a thrown %p as an internal error', (err) => {
    expect(handle(err)).toEqual({ status: 500, body: { error: 'Internal Server Error' } });
  });
});
