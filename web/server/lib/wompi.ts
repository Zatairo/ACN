import axios from 'axios';

const WOMPI_URL_SANDBOX = process.env.WOMPI_URL_SANDBOX || 'https://sandbox.wompi.co';
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || '';
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';
const WOMPI_INTEGRATION_ID = process.env.WOMPI_INTEGRATION_ID || '';
const WOMPI_SIGNATURE_KEY = process.env.WOMPI_SIGNATURE_KEY || '';

export class WompiService {
  static async createPaymentToken(amountInCents: number, email: string, paymentMethod: string) {
    // This is a simplified example. In reality, you would use Wompi's tokenization for cards
    // or create a payment link for other methods.
    // For now, we return a mock token.
    // TODO: Implement actual Wompi tokenization
    return {
      id: `tok_test_${Math.random().toString(36).substring(2, 15)}`,
      // In a real implementation, you would return the token id to be used in the checkout
    };
  }

  static async verifyWebhookSignature(signature: string, timestamp: string, body: string): Promise<boolean> {
    // Wompi sends a signature in the header 'x-signature' and a timestamp in 'x-timestamp'
    // The signature is an HMAC SHA256 of the concatenated string: timestamp + body
    // using the signature key as the secret.
    if (!WOMPI_SIGNATURE_KEY) {
      console.warn('WOMPI_SIGNATURE_KEY not set');
      return false;
    }
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', WOMPI_SIGNATURE_KEY);
    const data = timestamp + '.' + body;
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');
    return signature === expectedSignature;
  }
}

export default WompiService;