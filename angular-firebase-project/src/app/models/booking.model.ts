export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type DocumentType = "passport" | "id";
export type BookingType = "offer" | "flight" | "other";

export interface Passenger {
  fullName: string;
  phoneNumber: string;
  address: string;
  documentType: DocumentType;
  documentNumber: string;
}

export interface BookingExtras {
  extraBaggage: number;
  extraLegroom: number;
}

export interface Booking {
  id?: string;
  bookingType?: BookingType; // Type of booking: offer, flight, or other
  offerId?: string; // Required for 'offer' type, optional for others
  offerInstanceId?: string; // Required for 'offer' type, optional for others
  userId: string;
  userEmail?: string;
  userName?: string;
  offerTitle?: string;
  selectedDate?: string;
  quantity: number;
  pricePerPerson: number;
  totalPrice: number;
  status: BookingStatus;
  passengers?: Passenger[];
  extras?: BookingExtras;
  createdAt: any;
  updatedAt?: any;
}
