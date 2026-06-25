import { Injectable } from "@angular/core";
import { Observable, firstValueFrom } from "rxjs";
import { map } from "rxjs/operators";
import { ApiService } from "../core/api.service";
import { Reservation } from "../models/reservation.model";

export interface CreateReservationPayload {
  accommodationId: string;
  startDate: string;
  endDate: string;
  persons: number;
  price?: number;
}

function unwrapList<T>(res: { data: T[]; total: number } | T[]): T[] {
  return Array.isArray(res) ? res : (res.data ?? []);
}

@Injectable({ providedIn: "root" })
export class ReservationService {
  constructor(private api: ApiService) {}

  createReservation(payload: CreateReservationPayload): Observable<Reservation> {
    return this.api.post<Reservation>("reservations", payload);
  }

  getMyReservations(): Observable<Reservation[]> {
    return this.api
      .get<{ data: Reservation[]; total: number } | Reservation[]>("reservations/my")
      .pipe(map(unwrapList));
  }

  getAllReservations(): Observable<Reservation[]> {
    return this.api
      .get<{ data: Reservation[]; total: number } | Reservation[]>("reservations")
      .pipe(map(unwrapList));
  }

  confirmReservation(id: string): Promise<Reservation> {
    return firstValueFrom(this.api.patch<Reservation>(`reservations/${id}/confirm`, {}));
  }

  rejectReservation(id: string): Promise<Reservation> {
    return firstValueFrom(this.api.patch<Reservation>(`reservations/${id}/admin-cancel`, {}));
  }

  cancelReservation(id: string): Promise<void> {
    return firstValueFrom(this.api.delete<void>(`reservations/${id}`));
  }
}
