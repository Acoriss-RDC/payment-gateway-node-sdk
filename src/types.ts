export type Environment = 'sandbox' | 'live';

export interface ClientConfig {
  apiKey: string;
  /**
   * Optional API secret used to sign requests. If omitted, you must provide a custom signer
   * or explicit signature per request.
   */
  apiSecret?: string;
  environment?: Environment;
  /**
   * Override base URL (advanced). If provided, environment is ignored.
   */
  baseURL?: string;
  /**
   * Optional custom signer. If provided, it will be used to compute the X-SIGNATURE header.
   */
  signer?: Signer;
  /**
   * Request timeout in milliseconds (default: 15000)
   */
  timeoutMs?: number;
}

export interface Signer {
  sign: (body: string) => string;
}

export interface CustomerInfo {
  email: string;
  name: string;
  phone?: string;
}

export interface ServiceItem {
  name: string;
  price: number; // in smallest currency unit (e.g., cents)
  description?: string;
  quantity?: number; // default 1
}

export interface PaymentSessionRequest {
  amount: number;
  currency: string; // e.g., "USD"
  customer: CustomerInfo;
  description?: string;
  callbackUrl?: string;
  cancelUrl?: string;
  successUrl?: string;
  transactionId?: string; // merchant reference
  services?: ServiceItem[];
  // Allow extra fields for forward-compatibility
  [key: string]: unknown;
}

export interface PaymentSessionResponse {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  checkoutUrl: string;
  customer: CustomerInfo;
  createdAt: string; // ISO
}

export type PaymentStatus = 'P' | 'S' | 'C'; // P = Pending, S = Succeeded, C = Canceled

export interface PaymentService {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  price: number; // in cents
  currency: string | null; // ISO 4217 or null
  sessionId: string;
  createdAt: string; // ISO date string
}

export interface RetrievePaymentResponse {
  id: string;
  amount: number; // in cents
  currency: string; // ISO 4217
  description: string | null;
  transactionId: string;
  customer: {
    email: string | null;
    phone: string | null;
  };
  createdAt: string; // ISO date string
  expired: boolean;
  services: PaymentService[];
  status: PaymentStatus; // 'P' = Pending, 'S' = Succeeded, 'C' = Canceled
}
