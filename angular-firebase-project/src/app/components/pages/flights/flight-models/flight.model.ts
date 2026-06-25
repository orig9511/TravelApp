export interface Flight {
  id: string;
  airline: string;
  fromCode: string;
  toCode: string;
  fromLabel: string;
  toLabel: string;
  departAt: string;
  departDate: string;

  arriveAt: string;
  price: number;
  currency: string;
  stopsCount: number;
  durationMinutes: number;
  isRefundable: boolean;
  hasBaggage: boolean;
  availableSeats: number;
}
