import { TravelCategory } from "./offer.model";

export interface OfferFilterState {
  minPrice?: number;
  maxPrice?: number;

  minDays?: number;
  maxDays?: number;

  persons?: number;
  minStars?: number;

  travelCategory?: TravelCategory;
  travelDate?: string; // YYYY-MM-DD
}
