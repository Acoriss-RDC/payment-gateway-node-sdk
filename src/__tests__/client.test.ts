import nock = require('nock');
import * as crypto from 'crypto';
import { PaymentGatewayClient } from '../client';
import { APIError } from '../errors';
import { PaymentSessionRequest, PaymentSessionResponse, RetrievePaymentResponse } from '../types';

describe('PaymentGatewayClient', () => {
  const API_KEY = 'test-api-key';
  const API_SECRET = 'test-api-secret';
  const FIXED_TIMESTAMP = 1733260800; // Fixed timestamp for consistent tests

  beforeEach(() => {
    // Mock Date.now to return consistent timestamp
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIMESTAMP * 1000);
  });

  afterEach(() => {
    nock.cleanAll();
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with sandbox environment by default', () => {
      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });
      expect(client).toBeInstanceOf(PaymentGatewayClient);
    });

    it('should initialize with live environment', () => {
      const client = new PaymentGatewayClient({
        apiKey: API_KEY,
        apiSecret: API_SECRET,
        environment: 'live',
      });
      expect(client).toBeInstanceOf(PaymentGatewayClient);
    });

    it('should accept custom baseURL', () => {
      const client = new PaymentGatewayClient({
        apiKey: API_KEY,
        apiSecret: API_SECRET,
        baseURL: 'https://custom.api.com',
      });
      expect(client).toBeInstanceOf(PaymentGatewayClient);
    });

    it('should accept custom signer', () => {
      const customSigner = { sign: (body: string) => 'custom-signature' };
      const client = new PaymentGatewayClient({
        apiKey: API_KEY,
        signer: customSigner,
      });
      expect(client).toBeInstanceOf(PaymentGatewayClient);
    });
  });

  describe('signature generation', () => {
    it('should generate HMAC-SHA256 signature when apiSecret is provided', async () => {
      const payload: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const rawBody = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', API_SECRET)
        .update(rawBody, 'utf8')
        .digest('hex');

      const mockResponse: PaymentSessionResponse = {
        id: 'pay_123',
        amount: 5000,
        currency: 'USD',
        checkoutUrl: 'https://checkout.rdcard.net/sessions/123',
        customer: payload.customer,
        createdAt: '2025-11-15T10:00:00Z',
      };

      nock('https://sandbox.checkout.rdcard.net')
        .post('/api/v1/sessions', rawBody)
        .matchHeader('X-API-KEY', API_KEY)
        .matchHeader('X-SIGNATURE', expectedSignature)
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });
      const result = await client.createSession(payload);

      expect(result).toEqual(mockResponse);
    });

    it('should use signature override when provided', async () => {
      const OVERRIDE_SIGNATURE = 'override-signature';

      const payload: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockResponse: PaymentSessionResponse = {
        id: 'pay_123',
        amount: 5000,
        currency: 'USD',
        checkoutUrl: 'https://checkout.rdcard.net/sessions/123',
        customer: payload.customer,
        createdAt: '2025-11-15T10:00:00Z',
      };

      nock('https://sandbox.checkout.rdcard.net')
        .post('/api/v1/sessions')
        .matchHeader('X-SIGNATURE', OVERRIDE_SIGNATURE)
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });
      await client.createSession(payload, { signatureOverride: OVERRIDE_SIGNATURE });
    });

    it('should throw error when no signature is available', async () => {
      const client = new PaymentGatewayClient({ apiKey: API_KEY });
      const payload: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      await expect(client.createSession(payload)).rejects.toThrow(
        'No signature available. Provide apiSecret at client init, a custom signer, or pass signatureOverride.'
      );
    });
  });

  describe('createSession', () => {
    it('should successfully create a payment session', async () => {
      const payload: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'john@example.com',
          name: 'John Doe',
          phone: '+1234567890',
        },
        description: 'Payment for Order #1234',
        callbackUrl: 'https://example.com/api/callback',
        cancelUrl: 'https://example.com/cancel',
        successUrl: 'https://example.com/success',
        transactionId: 'order_1234',
        services: [
          {
            name: 'express_delivery',
            price: 1500,
            description: 'Express delivery service',
            quantity: 1,
          },
        ],
      };

      const mockResponse: PaymentSessionResponse = {
        id: 'pay_1234567890',
        amount: 5000,
        currency: 'USD',
        description: 'Payment for Order #1234',
        checkoutUrl: 'https://checkout.rdcard.net/sessions/abc123',
        customer: {
          email: 'john@example.com',
          name: 'John Doe',
          phone: '+1234567890',
        },
        createdAt: '2025-11-14T10:30:00Z',
      };

      nock('https://sandbox.checkout.rdcard.net')
        .post('/api/v1/sessions', JSON.stringify(payload))
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });
      const result = await client.createSession(payload);

      expect(result).toEqual(mockResponse);
      expect(result.checkoutUrl).toBe('https://checkout.rdcard.net/sessions/abc123');
      expect(result.id).toBe('pay_1234567890');
    });

    it('should handle API errors correctly', async () => {
      const payload: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      nock('https://sandbox.checkout.rdcard.net')
        .post('/api/v1/sessions')
        .reply(400, {
          message: 'Invalid request',
          code: 'INVALID_REQUEST',
        });

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });

      try {
        await client.createSession(payload);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        const apiError = error as APIError;
        expect(apiError.status).toBe(400);
        expect(apiError.data).toEqual({
          message: 'Invalid request',
          code: 'INVALID_REQUEST',
        });
      }
    });

    it('should handle authentication errors', async () => {
      const payload: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      nock('https://sandbox.checkout.rdcard.net')
        .post('/api/v1/sessions')
        .reply(401, {
          message: 'Unauthorized',
        });

      const client = new PaymentGatewayClient({ apiKey: 'invalid-key', apiSecret: API_SECRET });

      try {
        await client.createSession(payload);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        const apiError = error as APIError;
        expect(apiError.status).toBe(401);
      }
    });

    it('should handle server errors', async () => {
      const payload: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      nock('https://sandbox.checkout.rdcard.net')
        .post('/api/v1/sessions')
        .reply(500, {
          message: 'Internal server error',
        });

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });

      await expect(client.createSession(payload)).rejects.toThrow(APIError);
    });

    it('should handle network errors', async () => {
      const payload: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      nock('https://sandbox.checkout.rdcard.net')
        .post('/api/v1/sessions')
        .replyWithError('Network error');

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });

      await expect(client.createSession(payload)).rejects.toThrow();
    });

    it('should use live environment correctly', async () => {
      const payload: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const mockResponse: PaymentSessionResponse = {
        id: 'pay_123',
        amount: 5000,
        currency: 'USD',
        checkoutUrl: 'https://checkout.rdcard.net/sessions/123',
        customer: payload.customer,
        createdAt: '2025-11-15T10:00:00Z',
      };

      nock('https://checkout.rdcard.net')
        .post('/api/v1/sessions')
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({
        apiKey: API_KEY,
        apiSecret: API_SECRET,
        environment: 'live',
      });

      const result = await client.createSession(payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPayment', () => {
    it('should generate HMAC-SHA256 signature with paymentId when apiSecret is provided', async () => {
      const paymentId = 'pay_1234567890';
      const expectedSignature = crypto
        .createHmac('sha256', API_SECRET)
        .update(paymentId, 'utf8')
        .digest('hex');

      const mockResponse: RetrievePaymentResponse = {
        id: paymentId,
        amount: 5000,
        currency: 'USD',
        description: 'Payment for Order #1234',
        transactionId: 'order_1234',
        customer: {
          email: 'john@example.com',
          phone: '+1234567890',
        },
        createdAt: '2025-11-15T10:00:00Z',
        expired: false,
        services: [
          {
            id: 'svc_123',
            name: 'express_delivery',
            description: 'Express delivery service',
            quantity: 1,
            price: 1500,
            currency: 'USD',
            sessionId: 'sess_123',
            createdAt: '2025-11-15T10:00:00Z',
          },
        ],
        status: 'S',
      };

      nock('https://sandbox.checkout.rdcard.net')
        .get(`/api/v1/sessions/${paymentId}`)
        .matchHeader('X-API-KEY', API_KEY)
        .matchHeader('X-SIGNATURE', expectedSignature)
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });
      const result = await client.getPayment(paymentId);

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('S');
    });

    it('should use signature override when provided', async () => {
      const paymentId = 'pay_1234567890';
      const OVERRIDE_SIGNATURE = 'override-get-signature';

      const mockResponse: RetrievePaymentResponse = {
        id: paymentId,
        amount: 5000,
        currency: 'USD',
        description: null,
        transactionId: 'order_1234',
        customer: {
          email: 'test@example.com',
          phone: null,
        },
        createdAt: '2025-11-15T10:00:00Z',
        expired: false,
        services: [],
        status: 'P',
      };

      nock('https://sandbox.checkout.rdcard.net')
        .get(`/api/v1/sessions/${paymentId}`)
        .matchHeader('X-SIGNATURE', OVERRIDE_SIGNATURE)
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });
      await client.getPayment(paymentId, { signatureOverride: OVERRIDE_SIGNATURE });
    });

    it('should throw error when no signature is available', async () => {
      const client = new PaymentGatewayClient({ apiKey: API_KEY });

      await expect(client.getPayment('pay_123')).rejects.toThrow(
        'No signature available. Provide apiSecret at client init, a custom signer, or pass signatureOverride.'
      );
    });

    it('should successfully retrieve a pending payment', async () => {
      const paymentId = 'pay_pending_123';
      const mockResponse: RetrievePaymentResponse = {
        id: paymentId,
        amount: 5000,
        currency: 'USD',
        description: 'Payment for Order #1234',
        transactionId: 'order_1234',
        customer: {
          email: 'john@example.com',
          phone: '+1234567890',
        },
        createdAt: '2025-11-15T10:00:00Z',
        expired: false,
        services: [],
        status: 'P',
      };

      nock('https://sandbox.checkout.rdcard.net')
        .get(`/api/v1/sessions/${paymentId}`)
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });
      const result = await client.getPayment(paymentId);

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('P');
      expect(result.expired).toBe(false);
    });

    it('should successfully retrieve a succeeded payment with services', async () => {
      const paymentId = 'pay_succeeded_123';
      const mockResponse: RetrievePaymentResponse = {
        id: paymentId,
        amount: 6500,
        currency: 'USD',
        description: 'Payment for Order #1234',
        transactionId: 'order_1234',
        customer: {
          email: 'john@example.com',
          phone: '+1234567890',
        },
        createdAt: '2025-11-15T10:00:00Z',
        expired: false,
        services: [
          {
            id: 'svc_001',
            name: 'express_delivery',
            description: 'Express delivery service',
            quantity: 1,
            price: 1500,
            currency: 'USD',
            sessionId: 'sess_123',
            createdAt: '2025-11-15T10:00:00Z',
          },
        ],
        status: 'S',
      };

      nock('https://sandbox.checkout.rdcard.net')
        .get(`/api/v1/sessions/${paymentId}`)
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });
      const result = await client.getPayment(paymentId);

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('S');
      expect(result.services).toHaveLength(1);
      expect(result.services[0].name).toBe('express_delivery');
    });

    it('should successfully retrieve a canceled payment', async () => {
      const paymentId = 'pay_canceled_123';
      const mockResponse: RetrievePaymentResponse = {
        id: paymentId,
        amount: 5000,
        currency: 'USD',
        description: 'Canceled payment',
        transactionId: 'order_1234',
        customer: {
          email: 'john@example.com',
          phone: null,
        },
        createdAt: '2025-11-15T10:00:00Z',
        expired: true,
        services: [],
        status: 'C',
      };

      nock('https://sandbox.checkout.rdcard.net')
        .get(`/api/v1/sessions/${paymentId}`)
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });
      const result = await client.getPayment(paymentId);

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('C');
      expect(result.expired).toBe(true);
    });

    it('should handle 404 error when payment not found', async () => {
      const paymentId = 'pay_not_found';

      nock('https://sandbox.checkout.rdcard.net')
        .get(`/api/v1/sessions/${paymentId}`)
        .reply(404, {
          message: 'Payment not found',
          code: 'NOT_FOUND',
        });

      const client = new PaymentGatewayClient({ apiKey: API_KEY, apiSecret: API_SECRET });

      try {
        await client.getPayment(paymentId);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        const apiError = error as APIError;
        expect(apiError.status).toBe(404);
        expect(apiError.data).toEqual({
          message: 'Payment not found',
          code: 'NOT_FOUND',
        });
      }
    });

    it('should handle unauthorized error', async () => {
      const paymentId = 'pay_123';

      nock('https://sandbox.checkout.rdcard.net')
        .get(`/api/v1/sessions/${paymentId}`)
        .reply(401, {
          message: 'Invalid API key',
        });

      const client = new PaymentGatewayClient({ apiKey: 'invalid-key', apiSecret: API_SECRET });

      try {
        await client.getPayment(paymentId);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        const apiError = error as APIError;
        expect(apiError.status).toBe(401);
      }
    });

    it('should use live environment correctly', async () => {
      const paymentId = 'pay_live_123';
      const mockResponse: RetrievePaymentResponse = {
        id: paymentId,
        amount: 5000,
        currency: 'USD',
        description: null,
        transactionId: 'order_1234',
        customer: {
          email: 'test@example.com',
          phone: null,
        },
        createdAt: '2025-11-15T10:00:00Z',
        expired: false,
        services: [],
        status: 'S',
      };

      nock('https://checkout.rdcard.net')
        .get(`/api/v1/sessions/${paymentId}`)
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({
        apiKey: API_KEY,
        apiSecret: API_SECRET,
        environment: 'live',
      });

      const result = await client.getPayment(paymentId);
      expect(result).toEqual(mockResponse);
    });
  });
});
