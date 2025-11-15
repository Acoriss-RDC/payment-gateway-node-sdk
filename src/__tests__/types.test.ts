import {
  Environment,
  ClientConfig,
  CustomerInfo,
  ServiceItem,
  PaymentSessionRequest,
  PaymentSessionResponse,
  Signer,
} from '../types';

describe('Type definitions', () => {
  describe('Environment', () => {
    it('should accept valid environment values', () => {
      const sandbox: Environment = 'sandbox';
      const live: Environment = 'live';

      expect(sandbox).toBe('sandbox');
      expect(live).toBe('live');
    });
  });

  describe('ClientConfig', () => {
    it('should create valid client config with minimal fields', () => {
      const config: ClientConfig = {
        apiKey: 'test-key',
      };

      expect(config.apiKey).toBe('test-key');
    });

    it('should create valid client config with all fields', () => {
      const signer: Signer = { sign: (body: string) => 'signature' };
      const config: ClientConfig = {
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        environment: 'sandbox',
        baseURL: 'https://custom.api.com',
        signer,
        timeoutMs: 30000,
      };

      expect(config.apiKey).toBe('test-key');
      expect(config.apiSecret).toBe('test-secret');
      expect(config.environment).toBe('sandbox');
      expect(config.baseURL).toBe('https://custom.api.com');
      expect(config.signer).toBe(signer);
      expect(config.timeoutMs).toBe(30000);
    });
  });

  describe('CustomerInfo', () => {
    it('should create valid customer info', () => {
      const customer: CustomerInfo = {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
      };

      expect(customer.email).toBe('test@example.com');
      expect(customer.name).toBe('Test User');
      expect(customer.phone).toBe('+1234567890');
    });

    it('should create valid customer info without phone', () => {
      const customer: CustomerInfo = {
        email: 'test@example.com',
        name: 'Test User',
      };

      expect(customer.email).toBe('test@example.com');
      expect(customer.name).toBe('Test User');
      expect(customer.phone).toBeUndefined();
    });
  });

  describe('ServiceItem', () => {
    it('should create valid service item with all fields', () => {
      const service: ServiceItem = {
        name: 'express_delivery',
        price: 1500,
        description: 'Express delivery service',
        quantity: 2,
      };

      expect(service.name).toBe('express_delivery');
      expect(service.price).toBe(1500);
      expect(service.description).toBe('Express delivery service');
      expect(service.quantity).toBe(2);
    });

    it('should create valid service item with minimal fields', () => {
      const service: ServiceItem = {
        name: 'basic_service',
        price: 1000,
      };

      expect(service.name).toBe('basic_service');
      expect(service.price).toBe(1000);
    });
  });

  describe('PaymentSessionRequest', () => {
    it('should create valid payment session request', () => {
      const request: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
        description: 'Test payment',
        callbackUrl: 'https://example.com/callback',
        cancelUrl: 'https://example.com/cancel',
        successUrl: 'https://example.com/success',
        transactionId: 'txn_123',
        services: [
          {
            name: 'service_1',
            price: 1500,
          },
        ],
      };

      expect(request.amount).toBe(5000);
      expect(request.currency).toBe('USD');
      expect(request.customer.email).toBe('test@example.com');
    });

    it('should create minimal payment session request', () => {
      const request: PaymentSessionRequest = {
        amount: 5000,
        currency: 'USD',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      expect(request.amount).toBe(5000);
      expect(request.currency).toBe('USD');
    });
  });

  describe('PaymentSessionResponse', () => {
    it('should create valid payment session response', () => {
      const response: PaymentSessionResponse = {
        id: 'pay_123',
        amount: 5000,
        currency: 'USD',
        description: 'Test payment',
        checkoutUrl: 'https://checkout.rdcard.net/sessions/abc',
        customer: {
          email: 'test@example.com',
          name: 'Test User',
          phone: '+1234567890',
        },
        createdAt: '2025-11-15T10:00:00Z',
      };

      expect(response.id).toBe('pay_123');
      expect(response.checkoutUrl).toBe('https://checkout.rdcard.net/sessions/abc');
      expect(response.createdAt).toBe('2025-11-15T10:00:00Z');
    });
  });

  describe('Signer', () => {
    it('should create valid signer implementation', () => {
      const signer: Signer = {
        sign: (body: string) => {
          return `signed:${body}`;
        },
      };

      expect(signer.sign('test')).toBe('signed:test');
    });
  });
});
