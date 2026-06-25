import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { ApiService } from "../core/api.service";
import { Flight } from "../components/pages/flights/flight-models/flight.model";

export interface FlightSearchParams {
  fromCode?: string;
  toCode?: string;
  departDate?: string;
  departDateFrom?: string;
  departDateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  maxStops?: number;
  minDuration?: number;
  maxDuration?: number;
  minAvailableSeats?: number;
  airline?: string;
  isRefundable?: boolean;
  hasBaggage?: boolean;
  sortBy?: "price" | "duration" | "departTime" | "arrivalTime";
  page?: number;
  limit?: number;
}

export interface FlightSearchResponse {
  data: Flight[];
  total: number;
  searchLevel?: 0 | 1 | 2;
  dateRangeApplied?: { from: string; to: string };
}

export interface AirportSuggestion {
  code: string;
  label: string;
}

@Injectable({ providedIn: "root" })
export class FlightService {
  constructor(private api: ApiService) {}

  searchFlights(params: FlightSearchParams): Observable<FlightSearchResponse> {
    const query = Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    );
    return this.api.get<FlightSearchResponse>("flights", query as any).pipe(
      map((res) => ({
        ...res,
        data: (res.data ?? []).map((f) => ({ ...f, price: Number(f.price) })),
      })),
    );
  }

  getDiscoveryFlights(): Observable<Flight[]> {
    return this.api
      .get<Flight[]>("flights/discovery")
      .pipe(
        map((data) =>
          (data ?? []).map((f) => ({ ...f, price: Number(f.price) })),
        ),
      );
  }

  getCheapestPerDestination(): Observable<Flight[]> {
    return this.api
      .get<Flight[]>("flights/cheapest-per-destination")
      .pipe(
        map((data) =>
          (data ?? []).map((f) => ({ ...f, price: Number(f.price) })),
        ),
      );
  }

  searchAirports(q: string): Observable<AirportSuggestion[]> {
    return this.api.get<AirportSuggestion[]>("flights/airports", { q } as any);
  }

  getFlights(): Observable<Flight[]> {
    return this.searchFlights({ limit: 500, sortBy: "price" }).pipe(
      map((res) => res.data),
    );
  }

  getFlightById(id: string): Observable<Flight> {
    return this.api.get<Flight>(`flights/${id}`);
  }
}
