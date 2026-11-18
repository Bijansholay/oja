import crypto from "crypto";

export interface InitializePaymentParams {
  orderIds: string[];
  amountNaira: number;
  email: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface InitializePaymentResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaymentVerificationResult {
  paid: boolean;
  reference: string;
  amountNaira: number;
  orderIds: string[];
  channel?: string;
  currency?: string;
}

/**
 * Payment provider abstraction allowing swapping Paystack, Flutterwave, Monnify, etc.
 */
export interface PaymentProvider {
  name: string;
  isConfigured(): boolean;
  initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResult>;
  verifyTransaction(reference: string): Promise<PaymentVerificationResult>;
  verifyWebhookSignature(signature: string, rawBody: string): boolean;
}

/**
 * Paystack Payment Provider Implementation
 */
export class PaystackProvider implements PaymentProvider {
  name = "paystack";
  private secretKey: string | undefined;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
  }

  private getSecretKey(): string | undefined {
    return process.env.PAYSTACK_SECRET_KEY || this.secretKey;
  }

  isConfigured(): boolean {
    const key = this.getSecretKey();
    return !!(key && key.startsWith("sk_"));
  }

  async initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResult> {
    if (!this.isConfigured()) {
      // In demo mode or unconfigured key, generate mock checkout redirect
      const mockRef = `pstk_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        authorizationUrl: `/orders?payment_success=true&ref=${mockRef}`,
        accessCode: "mock_access_code",
        reference: mockRef,
      };
    }

    const amountKobo = Math.round(params.amountNaira * 100);

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        amount: amountKobo,
        callback_url: params.callbackUrl,
        metadata: {
          orderIds: params.orderIds,
          ...params.metadata,
        },
      }),
    });

    const data = await res.json();
    if (!data.status) {
      throw new Error(`Paystack initialization failed: ${data.message || "Unknown error"}`);
    }

    return {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<PaymentVerificationResult> {
    if (!this.isConfigured()) {
      return {
        paid: false,
        reference,
        amountNaira: 0,
        orderIds: [],
      };
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    const data = await res.json();
    if (!data.status) {
      throw new Error(`Paystack verification failed: ${data.message}`);
    }

    const paid = data.data.status === "success";
    const amountNaira = data.data.amount / 100;
    const orderIds = data.data.metadata?.orderIds || [];

    return {
      paid,
      reference: data.data.reference,
      amountNaira,
      orderIds,
      channel: data.data.channel,
      currency: data.data.currency,
    };
  }

  verifyWebhookSignature(signature: string, rawBody: string): boolean {
    const key = this.getSecretKey();
    if (!key) return false;
    const hash = crypto
      .createHmac("sha512", key)
      .update(rawBody)
      .digest("hex");
    return hash === signature;
  }
}

export const defaultPaymentProvider = new PaystackProvider();
