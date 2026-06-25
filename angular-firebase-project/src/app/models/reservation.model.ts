export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export interface Reservation {
  id: string;
  accommodationId: string;
  userId: string;
  flightId?: string;
  createdAt: string;
  updatedAt?: string;
  startDate: string;
  endDate: string;
  price: number;
  persons: number;
  status: ReservationStatus;
  accommodation?: {
    id: string;
    name: string;
    city?: string;
    imageUrl?: string;
    address?: string;
  };
}
