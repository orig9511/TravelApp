export interface AccommodationModel {
  id: string;
  user_id: string;

  imageUrl: string;
  name: string;
  type: string;
  price: number;
  //

  email: string;
  phone_number: string;

  rooms: number;
  persons: number;

  travelers_rating: number;
  //

  description: string;
  descriptionHu?: string;

  continent: string;
  country: string;
  city: string;
  address: string;
  zip_code: string;

  comments: string[];

  services: string[];

  createdAt: string;
}

// reservation külön adatbázist igényel
