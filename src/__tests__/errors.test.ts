import { APIError } from '../errors';

describe('APIError', () => {
  it('should create error with message only', () => {
    const error = new APIError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.name).toBe('APIError');
    expect(error.status).toBeUndefined();
    expect(error.data).toBeUndefined();
    expect(error.headers).toBeUndefined();
  });

  it('should create error with status and data', () => {
    const error = new APIError('Not found', {
      status: 404,
      data: { code: 'NOT_FOUND', details: 'Resource not found' },
    });
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error.data).toEqual({ code: 'NOT_FOUND', details: 'Resource not found' });
  });

  it('should create error with headers', () => {
    const headers = { 'x-request-id': '123', 'content-type': 'application/json' };
    const error = new APIError('Server error', { status: 500, headers });
    expect(error.headers).toEqual(headers);
  });

  it('should be instance of Error', () => {
    const error = new APIError('Test');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof APIError).toBe(true);
  });
});
