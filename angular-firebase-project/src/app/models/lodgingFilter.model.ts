export interface LodgingFilter {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  type?: string;
  persons?: number;
  services?: string[];
  travelers_rating?: number;
  startDate?: Date | null;
  endDate?: Date | null;
}
