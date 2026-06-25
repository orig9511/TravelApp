export interface Accommodation {
  id?: string;
  user_id?: string;

  imageUrl: string;
  name: string;
  type: string;
  pricePerNight: number;
  availablePlaces: number;

  mobile: string;
  email: string;

  roomCount?: number;
  capacityPerAccommodation: number;

  rating: number;
  stars: number;

  description: string;
  descriptionHu?: string;

  continent: string;
  country: string;
  city: string;
  address: string;

  comment?: string;

  services: string[];
}
