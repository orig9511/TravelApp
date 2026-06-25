export type TimeSlot = "morning" | "afternoon" | "evening";

export type FlightCardVM = {
  id: string;
  airline: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  stopsLabel: string;
  duration: string;
  price: number;
  currency: string;

  stopsCount: number;
  departureSlot: TimeSlot;
  arrivalSlot: TimeSlot;
  isRefundable: boolean;
  hasBaggage: boolean;

  availableSeats: number;
  departDate?: string;
  fromLabel?: string;
  toLabel?: string;
};
