import { Injectable } from "@angular/core";
import emailjs from "@emailjs/browser";

/**
 * EmailJS Service - Frontend-only email sending
 *
 * Setup: https://www.emailjs.com/
 * 1. Create free account
 * 2. Add email service (Gmail, Outlook, etc.)
 * 3. Create email template
 * 4. Get: Service ID, Template ID, Public Key
 */
@Injectable({
  providedIn: "root",
})
export class EmailService {
  // TODO: Replace with your EmailJS credentials from https://dashboard.emailjs.com/
  private SERVICE_ID = "service_zzqcm2q";
  private TEMPLATE_ID_BOOKING_CREATED = "template_e6134n5";
  private TEMPLATE_ID_BOOKING_CONFIRMED = "template_xb3v388";
  private PUBLIC_KEY = "hQ1YK4pq58ikAOQmA";

  constructor() {
    // Initialize EmailJS
    emailjs.init(this.PUBLIC_KEY);
  }

  /**
   * Send booking created email
   */
  async sendBookingCreatedEmail(
    userEmail: string,
    data: { userName: string; offerTitle: string; selectedDate: string },
  ): Promise<void> {
    try {
      const templateParams = {
        to_email: userEmail,
        user_name: data.userName,
        offer_title: data.offerTitle,
        selected_date: data.selectedDate,
      };

      await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID_BOOKING_CREATED,
        templateParams,
      );
    } catch (error) {
      console.error("❌ Failed to send booking created email:", error);
      // Don't throw - email failure shouldn't break booking flow
    }
  }

  /**
   * Send booking confirmed email
   */
  async sendBookingConfirmedEmail(
    userEmail: string,
    data: { userName: string; offerTitle: string },
  ): Promise<void> {
    try {
      const templateParams = {
        to_email: userEmail,
        user_name: data.userName,
        offer_title: data.offerTitle,
      };

      await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID_BOOKING_CONFIRMED,
        templateParams,
      );
    } catch (error) {
      console.error("❌ Failed to send booking confirmed email:", error);
      // Don't throw - email failure shouldn't break booking flow
    }
  }

  /**
   * Send booking rejection email
   */
  async sendBookingRejectionEmail(
    userEmail: string,
    bookingId: string,
    offerTitle: string,
    reason?: string,
  ): Promise<void> {
    try {
      const templateParams = {
        to_email: userEmail,
        booking_id: bookingId,
        offer_title: offerTitle,
        reason: reason || "No reason provided",
      };

      await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID_BOOKING_CONFIRMED, // Reuse template or create new one
        templateParams,
      );
    } catch (error) {
      console.error("❌ Failed to send booking rejection email:", error);
    }
  }
}
