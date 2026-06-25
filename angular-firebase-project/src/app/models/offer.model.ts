export type TravelCategory = "flight" | "individual" | "tour";

export interface ExtrasConfiguration {
  extraBaggage: number;
  extraLegroom: number;
}

export interface Offer {
  id: string;

  title: string;
  titleEn?: string;
  shortDescription: string;
  shortDescriptionEn?: string;
  description: string;
  descriptionEn?: string;

  travelCategory: TravelCategory;

  location: string;
  country: string;
  continent: string;

  price: number;
  currency: string;

  days: number;
  nights: number;
  persons: number;

  hotelName: string;
  hotelStars: number;
  hotelAddress: string;
  hotelPhone?: string;
  hotelEmail?: string;

  // Deprecated: kept for backward compatibility, flight details now in OfferInstance
  departureAirport?: string;
  arrivalAirport?: string;

  // Extras configuration
  extrasConfig?: ExtrasConfiguration;

  images: string[];

  travelPeriodStart: string; // ISO: 2026-06-01
  travelPeriodEnd: string; // ISO: 2026-08-31

  // Visibility controls
  isInactive?: boolean; // if true: visible but disabled/not bookable
  notShowable?: boolean; // if true: hidden from listings entirely

  // Analytics & tracking
  viewCount?: number; // Number of times offer detail page was viewed
  favoriteCount?: number; // Number of times offer was favorited

  // Ownership
  createdBy?: string; // userId of creator

  createdAt?: any;
}
