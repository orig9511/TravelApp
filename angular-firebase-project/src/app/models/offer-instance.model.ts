export interface ExtrasCapacity {
  extraBaggage: number;
  extraLegroom: number;
}

export interface ExtrasAvailable {
  extraBaggage: boolean;
  extraLegroom: boolean;
}

export interface FlightLeg {
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
}

export interface FlightDetails {
  outbound: FlightLeg;
  return?: FlightLeg;
  aircraft?: string;
}

export interface OfferInstance {
  id: string;
  offerId: string;
  departureDate: string;
  returnDate: string;
  pricePerPerson: number;
  capacity: number;
  availableCapacity: number;

  extrasCapacity?: ExtrasCapacity;
  extrasAvailable?: ExtrasAvailable;

  title?: string;
  image?: string;
  travelCategory?: string;

  flightDetails?: FlightDetails;

  /** @deprecated use flightDetails */
  flight?: FlightDetails;
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
}
