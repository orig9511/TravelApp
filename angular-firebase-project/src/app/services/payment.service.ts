import { Injectable } from "@angular/core";

export interface PaymentData {
  amount: number;
  currency: string;
  userId: string;
  bookingId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  timestamp: Date;
  message?: string;
}

@Injectable({
  providedIn: "root",
})
export class PaymentService {
  constructor() {}

  /**
   * Mock payment processing service
   * In production, this would integrate with Stripe, PayPal, or similar
   */
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result: PaymentResult = {
      success: true,
      transactionId: this.generateMockTransactionId(),
      timestamp: new Date(),
      message: "Payment processed successfully",
    };

    return result;
  }

  /**
   * Validate payment amount before processing
   */
  validatePaymentAmount(amount: number): boolean {
    return amount > 0 && amount < 1000000; // Max 1 million
  }

  /**
   * Generate a mock transaction ID
   */
  private generateMockTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `TXN-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Calculate total price including extras
   */
  calculateTotalPrice(
    basePrice: number,
    quantity: number,
    extraBaggage: number = 0,
    extraLegroom: number = 0,
    baggagePrice: number = 50,
    legroomPrice: number = 30,
  ): number {
    const baseTotal = basePrice * quantity;
    const extrasTotal =
      extraBaggage * baggagePrice + extraLegroom * legroomPrice;
    return baseTotal + extrasTotal;
  }
}
