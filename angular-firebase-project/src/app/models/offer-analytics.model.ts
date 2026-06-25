export interface OfferAnalytics {
  // Performance metrics
  viewCount: number;
  favoriteCount: number;
  bookingCount: number;
  conversionRate: number; // bookings / views * 100

  // Business value
  totalRevenue: number;
  avgBookingValue: number;

  // Demand signal
  totalCapacity: number;
  bookedCapacity: number;
  utilizationRate: number; // booked / total * 100

  // Trend (optional)
  last7DaysViews?: number;
}
