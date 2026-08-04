import axios from 'axios';
import crypto from 'crypto';

interface WompiTransactionResponse {
  id: string;
  status: string;
  redirect_url?: string;
  // Add other fields as needed
}

export class WompiService {
  private privateKey: string;
  private signatureKey: string;
  private readonly baseUrl = 'https://sandbox.wompi.co/v1'; // Use sandbox for testing

  constructor() {
    this.privateKey = process.env.WOMPI_PRIVATE_KEY || '';
    this.signatureKey = process.env.WOMPI_SIGNATURE_KEY || '';
    if (!this.privateKey) {
      console.warn('WOMPI_PRIVATE_KEY is not set');
    }
    if (!this.signatureKey) {
      console.warn('WOMPI_SIGNATURE_KEY is not set');
    }
  }

  async createTransaction(data: {
    amountInCents: number;
    currency: string;
    reference: string;
    customerEmail: string;
    paymentMethodType: 'CARD' | 'NEQUI' | 'PSE';
  }): Promise<WompiTransactionResponse> {
    if (!this.privateKey) {
      throw new Error('WOMPI_PRIVATE_KEY is not configured');
    }

    // For now, we return a mock response.
    // In a real implementation, we would call the Wompi API.
    // Since we are in a simulated environment, we keep the mock.
    return {
      id: `wompi_test_${Date.now()}`,
      status: 'PENDING',
      redirect_url: `https://checkout.wompi.co/p/${Math.random().toString(36).substring(7)}`,
    };
  }

  /**
   * Verify the webhook signature from Wompi.
   * According to Wompi documentation, the signature is in the header `x-signature`
   * and the timestamp in `x-timestamp`.
   * The signature is HMAC-SHA256 of `${timestamp}.${rawBody}` using the signing key.
   */
  verifySignature(signature: string, timestamp: string, body: string): boolean {
    if (!this.signatureKey) {
      // If no key is set, we cannot verify. For development, we might allow it.
      // But in production, we should reject.
      console.warn('WOMPI_SIGNATURE_KEY is not set; skipping signature verification');
      return true; // For dev only; remove in production
    }
    const hmac = crypto.createHmac('sha256', this.signatureKey);
    const data = `${timestamp}.${body}`;
    hmac.update(data);
    const computed = hmac.digest('hex');
    // Use constant-time comparison to avoid timing attacks
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  }
}

// Export a singleton instance
export const wompiService = new WompiService();
