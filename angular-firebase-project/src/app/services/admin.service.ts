import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "../core/api.service";

export interface SeedResult {
  message: string;
  inserted: {
    users: number;
    accommodations: number;
    flights: number;
    offers: number;
    offerInstances: number;
    bookings: number;
    favorites: number;
    notifications: number;
    reservations: number;
    total: number;
  };
}

@Injectable({ providedIn: "root" })
export class AdminService {
  constructor(private api: ApiService) {}

  triggerSeed(): Observable<SeedResult> {
    return this.api.post<SeedResult>("admin/seed", {});
  }
}
