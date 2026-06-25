import { Injectable } from "@angular/core";
import { Observable, firstValueFrom } from "rxjs";
import { map } from "rxjs/operators";
import { ApiService } from "../core/api.service";
import { Booking, Passenger, BookingExtras } from "../models/booking.model";

export interface CreateBookingData {
  offerId: string;
  offerInstanceId: string;
  quantity: number;
  passengers?: Passenger[];
  extras?: BookingExtras;
}

export interface CreateFlightBookingData {
  outboundFlightId: string;
  returnFlightId?: string;
  quantity: number;
  contact?: {
    lastName: string;
    firstName: string;
    email?: string;
    phone?: string;
  };
  baggage?: {
    cabin?: number;
    checked?: number;
    priority?: number;
  };
  idempotencyKey?: string;
}

function unwrapList<T>(res: { data: T[]; total: number } | T[]): T[] {
  return Array.isArray(res) ? res : (res.data ?? []);
}

@Injectable({ providedIn: "root" })
export class BookingService {
  constructor(private api: ApiService) {}

  createBooking(data: CreateBookingData): Observable<Booking> {
    return this.api.post<Booking>("bookings", {
      offerId: data.offerId,
      offerInstanceId: data.offerInstanceId,
      quantity: data.quantity,
      passengers: data.passengers ?? [],
      extras: data.extras ?? {},
    });
  }

  getMyBookings(): Observable<Booking[]> {
    return this.api
      .get<{ data: Booking[]; total: number } | Booking[]>("bookings/my")
      .pipe(map(unwrapList));
  }

  getUserBookings(): Observable<Booking[]> {
    return this.getMyBookings();
  }

  getBookingById(id: string): Observable<Booking> {
    return this.api.get<Booking>(`bookings/${id}`);
  }

  getAllBookings(): Observable<Booking[]> {
    return this.api
      .get<{ data: Booking[]; total: number } | Booking[]>("bookings")
      .pipe(map(unwrapList));
  }

  cancelBooking(id: string): Observable<Booking> {
    return this.api.patch<Booking>(`bookings/${id}/cancel`, {});
  }

  cancelBookingByUser(id: string): Promise<Booking> {
    return firstValueFrom(this.cancelBooking(id));
  }

  confirmBooking(id: string): Promise<Booking> {
    return firstValueFrom(
      this.api.patch<Booking>(`bookings/${id}/confirm`, {}),
    );
  }

  rejectBooking(id: string): Promise<Booking> {
    return firstValueFrom(
      this.api.patch<Booking>(`bookings/${id}/admin-cancel`, {}),
    );
  }

  getOfferBookingStats(offerId: string): Promise<any> {
    return firstValueFrom(this.api.get<any>(`bookings/offer-stats/${offerId}`));
  }

  createFlightBooking(data: CreateFlightBookingData): Promise<Booking> {
    return firstValueFrom(this.api.post<Booking>("flights/bookings", data));
  }
}
