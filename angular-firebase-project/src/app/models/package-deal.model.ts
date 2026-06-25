import { AccommodationModel } from "./lodging.model";
import { Flight } from "../components/pages/flights/flight-models/flight.model";

export interface PackageDeal {
  accommodation: AccommodationModel;
  flight: Flight;
  totalPrice: number;
  score: number;
  label: "Best Value" | "Top Rated" | "All Included" | null;
  matchLevel: 1 | 2 | 3;
}
