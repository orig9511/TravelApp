import { AccommodationModel } from "./lodging.model";

export interface Favorite {
  id?: string;
  userId?: string;
  offerId: string | null;
  accommodationId?: string | null;
  accommodation?: AccommodationModel;
  savedAt: number;
}
