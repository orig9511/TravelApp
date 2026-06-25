/**
 * BookingResponse DTO
 * Sanitized response that excludes sensitive/internal fields.
 * Used to prevent accidental exposure of sensitive data in API responses.
 */
export class BookingResponse {
  id: string;
  bookingType: string;
  offerId: string;
  offerInstanceId: string;
  userId: string;
  quantity: number;
  status: string;
  totalPrice: number;
  pricePerPerson: number;
  selectedDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Note: Excluded fields
  // - userEmail (sensitive)
  // - userName (sensitive)
  // - passengers (sensitive PII)
  // - idempotencyKey (internal)
  // - documentNumber from passengers (sensitive PII)
  // - phoneNumber from passengers (sensitive)

  static fromEntity(booking: any): BookingResponse {
    const response = new BookingResponse();
    response.id = booking.id;
    response.bookingType = booking.bookingType;
    response.offerId = booking.offerId;
    response.offerInstanceId = booking.offerInstanceId;
    response.userId = booking.userId;
    response.quantity = booking.quantity;
    response.status = booking.status;
    response.totalPrice = booking.totalPrice;
    response.pricePerPerson = booking.pricePerPerson;
    response.selectedDate = booking.selectedDate;
    response.createdAt = booking.createdAt;
    response.updatedAt = booking.updatedAt;
    return response;
  }

  static mapArray(bookings: any[]): BookingResponse[] {
    return bookings.map((b) => BookingResponse.fromEntity(b));
  }
}

/**
 * BookingDetailResponse DTO
 * Extended response for booking owner/admin access.
 * Includes passengers and contact info (with PII protection).
 */
export class BookingDetailResponse extends BookingResponse {
  userName?: string; // Only for booking owner or admin
  offerTitle?: string;
  // Passengers excluded at this level - fetch separately if needed
  extras?: any;

  static fromEntity(
    booking: any,
    userIdContext?: string,
  ): BookingDetailResponse {
    const response = new BookingDetailResponse();
    // Inherit base fields
    Object.assign(response, BookingResponse.fromEntity(booking));

    // Add extended fields only if user is authorized
    if (userIdContext === booking.userId || userIdContext === "admin") {
      response.userName = booking.userName;
      response.offerTitle = booking.offerTitle;
      response.extras = booking.extras;
      // Still exclude passengers - too sensitive
    }
    return response;
  }
}
