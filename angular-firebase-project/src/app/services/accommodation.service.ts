import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { ApiService } from "../core/api.service";
import { Accommodation } from "../models/accommodation.model";

@Injectable({ providedIn: "root" })
export class AccommodationService {
  constructor(private api: ApiService) {}

  getAccommodations(): Observable<Accommodation[]> {
    return this.api
      .get<{ data: Accommodation[]; total: number } | Accommodation[]>(
        "accommodations",
      )
      .pipe(map((res) => (Array.isArray(res) ? res : res.data ?? [])));
  }

  getAccommodationById(id: string): Observable<Accommodation> {
    return this.api.get<Accommodation>(`accommodations/${id}`);
  }

  addAccommodation(
    accommodation: Omit<Accommodation, "id">,
  ): Observable<Accommodation> {
    return this.api.post<Accommodation>("accommodations", accommodation);
  }

  updateAccommodation(
    id: string,
    data: Partial<Accommodation>,
  ): Observable<Accommodation> {
    return this.api.patch<Accommodation>(`accommodations/${id}`, data);
  }

  deleteAccommodation(id: string): Observable<void> {
    return this.api.delete<void>(`accommodations/${id}`);
  }
}
