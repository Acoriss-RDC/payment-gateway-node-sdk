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

# run tests
yarn test

# run tests in watch mode
yarn test:watch

# run tests with coverage
yarn test:coverage

# type-check
yarn typecheck

# build to dist/
yarn build
```

### Pre-commit Hooks

This project uses Husky and lint-staged to ensure code quality before commits:

- **lint-staged**: Runs typecheck and tests on staged TypeScript files
- **pre-commit hook**: Runs the full test suite, type checking, and build

The pre-commit hook will automatically run when you commit changes. If any check fails, the commit will be blocked until the issues are fixed.

To bypass the pre-commit hook (not recommended), use:
```bash
git commit --no-verify
```

### Testing

The project uses Jest with ts-jest for testing. Tests are located in `src/__tests__/` and cover:

- **client.test.ts**: Client initialization, signature generation, session creation, error handling
- **errors.test.ts**: APIError class functionality
- **types.test.ts**: TypeScript type definitions and interfaces

Coverage threshold is set to 80% for branches, functions, lines, and statements.