import nock = require('nock');
import * as crypto from 'crypto';
import { PaymentGatewayClient } from '../client';
import { APIError } from '../errors';
import { PaymentSessionRequest, PaymentSessionResponse } from '../types';

describe('PaymentGatewayClient', () => {
  const API_KEY = 'test-api-key';
  const API_SECRET = 'test-api-secret';

  afterEach(() => {
    nock.cleanAll();
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

    it('should use custom signer when provided', async () => {
      const CUSTOM_SIGNATURE = 'my-custom-signature';
      const customSigner = { sign: jest.fn(() => CUSTOM_SIGNATURE) };

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
        .matchHeader('X-SIGNATURE', CUSTOM_SIGNATURE)
        .reply(200, mockResponse);

      const client = new PaymentGatewayClient({ apiKey: API_KEY, signer: customSigner });
      await client.createSession(payload);

      expect(customSigner.sign).toHaveBeenCalledWith(JSON.stringify(payload));
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
});
