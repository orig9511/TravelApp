import { Injectable } from "@angular/core";
import { combineLatest, map, Observable, shareReplay } from "rxjs";

import { LodgingService } from "./lodging.service";
import { FlightService } from "./flight.service";
import { PackageDeal } from "../models/package-deal.model";
import { AccommodationModel } from "../models/lodging.model";
import { Flight } from "../components/pages/flights/flight-models/flight.model";

const COUNTRY_AIRPORTS: Record<string, string[]> = {
  Austria: ["VIE"],
  "Czech Republic": ["PRG"],
  France: ["CDG"],
  Germany: ["FRA", "MUC"],
  Greece: ["ATH"],
  Hungary: ["BUD"],
  Italy: ["FCO"],
  Netherlands: ["AMS"],
  Spain: ["BCN", "MAD"],
  Turkey: ["IST"],
  "United Arab Emirates": ["DXB"],
  "United Kingdom": ["LHR"],
  "United States": ["JFK"],
};

const NEARBY_COUNTRIES: Record<string, string[]> = {
  Slovakia: ["Czech Republic", "Hungary", "Austria"],
  Slovenia: ["Austria", "Italy"],
  Croatia: ["Italy", "Hungary", "Austria"],
  Serbia: ["Hungary"],
  Romania: ["Hungary"],
  Bulgaria: ["Greece", "Turkey"],
  Switzerland: ["Germany", "France", "Austria"],
  Belgium: ["France", "Netherlands", "Germany"],
  Luxembourg: ["France", "Germany", "Netherlands"],
  Portugal: ["Spain"],
  Monaco: ["France"],
  Liechtenstein: ["Austria", "Germany"],
  "San Marino": ["Italy"],
  "Vatican City": ["Italy"],
  Montenegro: ["Italy"],
  Albania: ["Italy", "Greece"],
  "North Macedonia": ["Greece"],
  Kosovo: ["Hungary"],
};

@Injectable({
  providedIn: "root",
})
export class PackageService {
  private readonly data$ = combineLatest([
    this.lodgingService.getLodgings(),
    this.flightService.getCheapestPerDestination(),
  ]).pipe(shareReplay(1));

  constructor(
    private lodgingService: LodgingService,
    private flightService: FlightService,
  ) {}

  private cityMatchesFlight(lodgingCity: string, flight: Flight): boolean {
    const city = lodgingCity.toLowerCase().trim();
    const label = (flight.toLabel ?? "").toLowerCase().trim();
    return label === city || label.includes(city) || city.includes(label);
  }

  private cheapest(flights: Flight[]): Flight {
    return flights.reduce((prev, curr) =>
      Number(curr.price) < Number(prev.price) ? curr : prev,
    );
  }

  private findBestFlight(
    lodging: AccommodationModel,
    flights: Flight[],
  ): { flight: Flight; matchLevel: 1 | 2 | 3 } | null {
    // L1: exact city text match
    const l1 = flights.filter((f) => this.cityMatchesFlight(lodging.city, f));
    if (l1.length > 0) {
      return { flight: this.cheapest(l1), matchLevel: 1 };
    }

    // L2: same-country airport match
    const countryCodes = COUNTRY_AIRPORTS[lodging.country] ?? [];
    if (countryCodes.length > 0) {
      const l2 = flights.filter((f) => countryCodes.includes(f.toCode));
      if (l2.length > 0) {
        return { flight: this.cheapest(l2), matchLevel: 2 };
      }
    }

    // L3: nearby-country airport match
    const nearbyCountries = NEARBY_COUNTRIES[lodging.country] ?? [];
    const nearbyCodes = nearbyCountries.flatMap(
      (c) => COUNTRY_AIRPORTS[c] ?? [],
    );
    if (nearbyCodes.length > 0) {
      const l3 = flights.filter((f) => nearbyCodes.includes(f.toCode));
      if (l3.length > 0) {
        return { flight: this.cheapest(l3), matchLevel: 3 };
      }
    }

    return null;
  }

  getPackageDeals(cityFilter?: string): Observable<PackageDeal[]> {
    return this.data$.pipe(
      map(([lodgings, flights]) => {
        const filteredLodgings = cityFilter
          ? lodgings.filter(
              (l) => l.city.toLowerCase() === cityFilter.toLowerCase(),
            )
          : lodgings;

        const deals: PackageDeal[] = [];

        for (const lodging of filteredLodgings) {
          const result = this.findBestFlight(lodging, flights);
          if (!result) continue;

          deals.push({
            accommodation: lodging,
            flight: result.flight,
            totalPrice: Number(lodging.price) + Number(result.flight.price),
            score: 0,
            label: null,
            matchLevel: result.matchLevel,
          });
        }

        if (deals.length > 0) {
          const prices = deals.map((d) => d.totalPrice);
          const minP = Math.min(...prices);
          const maxP = Math.max(...prices);
          const range = maxP - minP || 1;

          for (const d of deals) {
            const rating = Number(d.accommodation.travelers_rating) || 0;
            d.score =
              ((maxP - d.totalPrice) / range) * 40 +
              (rating / 5) * 40 +
              (d.flight.hasBaggage ? 5 : 0) +
              (d.flight.isRefundable ? 5 : 0);
          }

          let topRatedAssigned = false;
          let allIncludedAssigned = false;
          let bestValueAssigned = false;

          const sorted = [...deals].sort((a, b) => b.score - a.score);
          for (const d of sorted) {
            const rating = Number(d.accommodation.travelers_rating) || 0;
            if (!topRatedAssigned && rating >= 4.5) {
              d.label = "Top Rated";
              topRatedAssigned = true;
            } else if (
              !allIncludedAssigned &&
              d.flight.hasBaggage &&
              d.flight.isRefundable
            ) {
              d.label = "All Included";
              allIncludedAssigned = true;
            } else if (!bestValueAssigned && d.totalPrice === minP) {
              d.label = "Best Value";
              bestValueAssigned = true;
            }
          }
        }

        return deals.sort((a, b) => b.score - a.score);
      }),
    );
  }

  getAvailableCities(): Observable<string[]> {
    return this.data$.pipe(
      map(([lodgings, flights]) => {
        const cities = lodgings
          .filter((l) => this.findBestFlight(l, flights) !== null)
          .map((l) => l.city);
        return [...new Set(cities)].sort();
      }),
    );
  }
}
