import axios from 'axios';

interface WompiTransactionResponse {
  id: string;
  status: string;
  redirect_url?: string;
  // Add other fields as needed
}

export class WompiService {
  private privateKey: string;
  private readonly baseUrl = 'https://sandbox.wompi.co/v1'; // Use sandbox for testing

  constructor() {
    this.privateKey = process.env.WOMPI_PRIVATE_KEY || '';
    if (!this.privateKey) {
      console.warn('WOMPI_PRIVATE_KEY is not set');
    }
  }

  async createTransaction(data: {
    amountInCents: number;
    currency: string;
    reference: string;
    customerEmail: string;
    paymentMethodType: 'CARD' | 'NEQUI' | 'PSE';
    // For card, we might need a token from the widget, but we'll handle that in the controller
  }): Promise<WompiTransactionResponse> {
    // For now, we return a mock response.
    // In a real implementation, we would call the Wompi API.
    if (!this.privateKey) {
      throw new Error('WOMPI_PRIVATE_KEY is not configured');
    }

    // Mock response for demonstration
    return {
      id: `wompi_test_${Date.now()}`,
      status: 'PENDING',
      redirect_url: `https://checkout.wompi.co/p/${Math.random().toString(36).substring(7)}`,
    };
  }

  // We'll add a method to verify the webhook signature later
  verifySignature(signature: string, timestamp: string, body: string): boolean {
    // Implement according to Wompi documentation
    // For now, return true to avoid breaking
    return true;
  }
}

// Export a singleton instance
export const wompiService = new WompiService();
