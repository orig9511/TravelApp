import { AccommodationModel } from "./../models/lodging.model";
import { LodgingFilter } from "./../models/lodgingFilter.model";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { Reservation } from "../models/reservation.model";
import { AccommodationService } from "./accommodation.service";
import { Accommodation } from "../models/accommodation.model";

function toAccommodationModel(acc: Accommodation): AccommodationModel {
  return {
    id: acc.id ?? "",
    user_id: acc.user_id ?? "",
    imageUrl: acc.imageUrl,
    name: acc.name,
    type: acc.type,
    price: Number(acc.pricePerNight),
    email: acc.email,
    phone_number: acc.mobile,
    rooms: acc.roomCount ?? 0,
    persons: acc.capacityPerAccommodation,
    travelers_rating: acc.rating,
    description: acc.description,
    descriptionHu: acc.descriptionHu,
    continent: acc.continent,
    country: acc.country,
    city: acc.city,
    address: acc.address,
    zip_code: "",
    comments: acc.comment ? [acc.comment] : [],
    services: acc.services ?? [],
    createdAt: "",
  };
}

@Injectable({
  providedIn: "root",
})
export class LodgingService {
  constructor(private accommodationService: AccommodationService) {}

  getAccommodationById(id: string) {
    return this.accommodationService
      .getAccommodationById(id)
      .pipe(map((acc) => toAccommodationModel(acc)));
  }

  getBookings(): Observable<Reservation[]> {
    return new Observable((observer) => {
      observer.next([]);
      observer.complete();
    });
  }

  getLodgings(): Observable<AccommodationModel[]> {
    return this.accommodationService
      .getAccommodations()
      .pipe(map((list) => list.map(toAccommodationModel)));
  }

  getFilteredLodgings(filter: LodgingFilter): Observable<AccommodationModel[]> {
    return this.getLodgings().pipe(
      map((lodgings) =>
        lodgings.filter((lodging) => {
          const matchCity =
            !filter.city ||
            lodging.city.toLowerCase() === filter.city.toLowerCase();
          const matchPersons = lodging.persons >= Number(filter.persons || 0);
          const matchMaxPrice =
            !filter.maxPrice ||
            filter.maxPrice == 0 ||
            lodging.price <= Number(filter.maxPrice);
          const matchType =
            !filter.type ||
            filter.type === "all" ||
            lodging.type.toLowerCase() === filter.type.toLowerCase();
          const matchService =
            !filter.services?.length ||
            filter.services.every((s) => lodging.services.includes(s));
          const matchRating =
            (filter.travelers_rating || 0) <= lodging.travelers_rating;

          return (
            matchCity &&
            matchPersons &&
            matchMaxPrice &&
            matchType &&
            matchService &&
            matchRating
          );
        }),
      ),
    );
  }

  getTopLodgingsByPrice(limit: number = 10): Observable<AccommodationModel[]> {
    return this.getLodgings().pipe(
      map((lodgings) =>
        lodgings
          .slice()
          .sort((a, b) => a.price - b.price)
          .slice(0, limit),
      ),
    );
  }

  getCitySuggestions(searchTerm: string): Observable<string[]> {
    return this.getLodgings().pipe(
      map((lodgings) => {
        const term = searchTerm.toLowerCase().trim();
        const cities = lodgings
          .map((l) => l.city)
          .filter((city) => city.toLowerCase().startsWith(term));
        return [...new Set(cities)];
      }),
    );
  }
}
