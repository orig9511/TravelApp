import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, shareReplay, tap } from "rxjs/operators";
import { Offer } from "../models/offer.model";
import { OfferFilterState } from "../models/offerfilterstate.model";
import { ApiService } from "../core/api.service";

export interface PaginatedOffers {
  data: Offer[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: "root",
})
export class OfferService {
  // Cache the unfiltered offer list — invalidated on create/update/delete
  private offersCache$: Observable<Offer[]> | null = null;

  constructor(private api: ApiService) {}

  getOffers(filter?: Partial<OfferFilterState>): Observable<Offer[]> {
    const hasFilter =
      filter &&
      Object.keys(filter).some((k) => (filter as any)[k] !== undefined);

    if (!hasFilter) {
      if (!this.offersCache$) {
        this.offersCache$ = this.api
          .get<PaginatedOffers | Offer[]>("offers", {})
          .pipe(
            map((res: any) => res.data ?? res),
            map((res) => (Array.isArray(res) ? res : [])),
            shareReplay({ bufferSize: 1, refCount: false }),
          );
      }
      return this.offersCache$;
    }

    const params: Record<string, string | number | boolean> = {};
    if (filter?.travelCategory)
      params["travelCategory"] = filter.travelCategory;
    if (filter?.minPrice !== undefined) params["minPrice"] = filter.minPrice;
    if (filter?.maxPrice !== undefined) params["maxPrice"] = filter.maxPrice;
    if (filter?.minDays !== undefined) params["minDays"] = filter.minDays;
    if (filter?.maxDays !== undefined) params["maxDays"] = filter.maxDays;
    if (filter?.persons !== undefined) params["persons"] = filter.persons;
    if (filter?.travelDate) params["travelDate"] = filter.travelDate;

    return this.api.get<PaginatedOffers | Offer[]>("offers", params).pipe(
      map((res: any) => res.data ?? res),
      map((res) => (Array.isArray(res) ? res : [])),
    );
  }

  invalidateCache(): void {
    this.offersCache$ = null;
  }

  getMyOffers(filter?: Partial<OfferFilterState>): Observable<Offer[]> {
    const params: Record<string, string | number | boolean> = {};
    if (filter?.travelCategory)
      params["travelCategory"] = filter.travelCategory;
    if (filter?.minPrice !== undefined) params["minPrice"] = filter.minPrice;
    if (filter?.maxPrice !== undefined) params["maxPrice"] = filter.maxPrice;
    if (filter?.minDays !== undefined) params["minDays"] = filter.minDays;
    if (filter?.maxDays !== undefined) params["maxDays"] = filter.maxDays;
    if (filter?.persons !== undefined) params["persons"] = filter.persons;

    return this.api.get<PaginatedOffers | Offer[]>("offers/my", params).pipe(
      map((res: any) => res.data ?? res),
      map((res) => (Array.isArray(res) ? res : [])),
    );
  }

  getOfferById(id: string): Observable<Offer> {
    return this.api.get<Offer>(`offers/${id}`);
  }

  createOffer(offer: Omit<Offer, "id" | "createdAt">): Observable<Offer> {
    return this.api
      .post<Offer>("offers", offer)
      .pipe(tap(() => this.invalidateCache()));
  }

  createOfferGetId(offer: Omit<Offer, "id" | "createdAt">): Observable<string> {
    return this.api.post<Offer>("offers", offer).pipe(
      tap(() => this.invalidateCache()),
      map((o) => o.id),
    );
  }

  updateOffer(id: string, data: Partial<Offer>): Observable<Offer> {
    return this.api
      .patch<Offer>(`offers/${id}`, data)
      .pipe(tap(() => this.invalidateCache()));
  }

  updateVisibility(
    offerId: string,
    visibility: { isInactive?: boolean; notShowable?: boolean },
  ): Observable<Offer> {
    return this.api.patch<Offer>(`offers/${offerId}/visibility`, visibility);
  }

  deleteOffer(id: string): Observable<void> {
    return this.api
      .delete<void>(`offers/${id}`)
      .pipe(tap(() => this.invalidateCache()));
  }

  getMostViewedOffers(limit: number = 10): Observable<Offer[]> {
    return this.api.get<Offer[]>("offers/top/views", { limit });
  }

  getMostFavoritedOffers(limit: number = 10): Observable<Offer[]> {
    return this.api.get<Offer[]>("offers/top/favorites", { limit });
  }

  getOfferAnalytics(offerId: string): Observable<any> {
    return this.api.get<any>(`offers/${offerId}/analytics`);
  }

  incrementViewCount(offerId: string): Observable<void> {
    return this.api.patch<void>(`offers/${offerId}/view`, {});
  }

  // ─── Local client-side filter ─────────────────────────────────────────────

  filterOffers(offers: Offer[], filters: OfferFilterState): Offer[] {
    return offers;
  }
}
