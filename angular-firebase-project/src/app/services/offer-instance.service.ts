import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "../core/api.service";
import { OfferInstance } from "../models/offer-instance.model";

@Injectable({
  providedIn: "root",
})
export class OfferInstanceService {
  constructor(private api: ApiService) {}

  getInstancesByOfferId(offerId: string): Observable<OfferInstance[]> {
    return this.api.get<OfferInstance[]>(`offer-instances/by-offer/${offerId}`);
  }

  getInstanceById(id: string): Observable<OfferInstance> {
    return this.api.get<OfferInstance>(`offer-instances/${id}`);
  }

  createInstance(
    instance: Omit<OfferInstance, "id" | "availableCapacity">,
  ): Observable<OfferInstance> {
    return this.api.post<OfferInstance>("offer-instances", instance);
  }

  updateInstance(
    id: string,
    data: Partial<OfferInstance>,
  ): Observable<OfferInstance> {
    return this.api.patch<OfferInstance>(`offer-instances/${id}`, data);
  }

  deleteInstance(id: string): Observable<void> {
    return this.api.delete<void>(`offer-instances/${id}`);
  }
}
