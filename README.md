# Acoriss Payment Gateway SDK (Node.js / TypeScript)

A lightweight TypeScript SDK to create payment sessions with the Acoriss payment gateway.

## Install

Uses yarn:

```bash
yarn add @acoriss/payment-gateway
```

## Quick start

```ts
import { PaymentGatewayClient } from '@acoriss/payment-gateway';

const client = new PaymentGatewayClient({
  apiKey: process.env.PG_API_KEY!,
  // Option 1: provide `apiSecret` to use default HMAC-SHA256(body, secret) signature
  apiSecret: process.env.PG_API_SECRET!,
  // or Option 2: provide a custom signer via { signer } or per-call signatureOverride
  environment: 'sandbox', // or 'live'
});

const session = await client.createSession({
  amount: 5000,
  currency: 'USD',
  customer: { email: 'john@example.com', name: 'John Doe', phone: '+1234567890' },
  description: 'Payment for Order #1234',
  callbackUrl: 'https://example.com/api/callback',
  cancelUrl: 'https://example.com/cancel',
  successUrl: 'https://example.com/success',
  transactionId: 'order_1234',
  services: [
    { name: 'express_delivery', price: 1500, description: 'Express delivery service', quantity: 1 },
  ],
});

console.log('Checkout URL:', session.checkoutUrl);
```

## Signature

By default the SDK computes `X-SIGNATURE` as `HMAC-SHA256(JSON.stringify(body), apiSecret)` if you provide `apiSecret`.

If your gateway uses a different signing algorithm, you can:

- Provide a custom signer:

```ts
const client = new PaymentGatewayClient({
  apiKey: '...',
  signer: { sign: (raw) => myCustomSignature(raw) },
});
```

- Or override per call:

```ts
client.createSession(payload, { signatureOverride: 'precomputed-signature' });
```

## Configuration

- apiKey: string (required)
- apiSecret?: string (optional; enables default HMAC-SHA256 signature)
- signer?: { sign(body: string): string } (optional; custom signer)
- environment?: 'sandbox' | 'live' (default: sandbox)
- baseURL?: string (optional override of base URL)
- timeoutMs?: number (default: 15000)

## API

- createSession(payload: PaymentSessionRequest, opts?: { signatureOverride?: string }): Promise<PaymentSessionResponse>

## Types

See TypeScript declarations for `PaymentSessionRequest` and `PaymentSessionResponse` in `src/types.ts`.

## Error handling

Errors throw `APIError` with `status`, `data`, and `headers` from the HTTP response when available.

## Development

```bash
# install deps
yarn

# type-check and build to dist/
yarn typecheck
yarn build
```