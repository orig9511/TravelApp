export interface FlightPassengers {
  adults: number;
  children: number;
  seniors: number;
}

export interface BookingBaggage {
  cabin: number;
  checked: number;
  priority: number;
}

export interface BookingFlightSnapshot {
  airline: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  price: number;
  currency: string;
  stopsLabel: string;
}

export interface BookingContact {
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
}

export interface BookingPricing {
  outboundPrice: number;
  returnPrice: number;
  basePrice: number;
  baggagePrice: number;
  totalPrice: number;
  currency: string;
}

export interface Booking {
  id?: string;
  userId?: string | null;
  contact: BookingContact;
  passengers: FlightPassengers;
  outboundFlight: BookingFlightSnapshot;
  returnFlight: BookingFlightSnapshot | null;
  baggage: BookingBaggage;
  pricing: BookingPricing;
  status: string;
  createdAt: any;
}
