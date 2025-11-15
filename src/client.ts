import axios, { AxiosInstance, AxiosError } from 'axios';
import * as crypto from 'crypto';
import { APIError } from './errors';
import {
  ClientConfig,
  Environment,
  PaymentSessionRequest,
  PaymentSessionResponse,
  Signer,
} from './types';

const BASE_URLS: Record<Environment, string> = {
  sandbox: 'https://sandbox.checkout.rdcard.net/api/v1',
  live: 'https://checkout.rdcard.net/api/v1',
};

class HmacSha256Signer implements Signer {
  constructor(private readonly secret: string) { }
  sign(body: string): string {
    return crypto.createHmac('sha256', this.secret).update(body, 'utf8').digest('hex');
  }
}

export class PaymentGatewayClient {
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly signer?: Signer;

  constructor(config: ClientConfig) {
    const environment: Environment = config.environment ?? 'sandbox';
    const baseURL = config.baseURL ?? BASE_URLS[environment];

    this.apiKey = config.apiKey;
    this.signer = config.signer ?? (config.apiSecret ? new HmacSha256Signer(config.apiSecret) : undefined);

    this.http = axios.create({
      baseURL,
      timeout: config.timeoutMs ?? 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Creates a payment session.
   * Computes X-SIGNATURE using either the provided signer or default HMAC-SHA256(secret, rawBody).
   */
  async createSession(payload: PaymentSessionRequest, opts?: { signatureOverride?: string }): Promise<PaymentSessionResponse> {
    const rawBody = JSON.stringify(payload);
    const signature = opts?.signatureOverride ?? this.signer?.sign(rawBody);

    if (!signature) {
      throw new Error(
        'No signature available. Provide apiSecret at client init, a custom signer, or pass signatureOverride.'
      );
    }

    try {
      const res = await this.http.post<PaymentSessionResponse>('/sessions', rawBody, {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-SIGNATURE': signature,
        },
      });
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err as AxiosError<any>;
        const message = e.response?.data?.message || e.message || 'Request failed';
        throw new APIError(message, {
          status: e.response?.status,
          data: e.response?.data,
          headers: e.response?.headers as any,
        });
      }
      throw err;
    }
  }
}
