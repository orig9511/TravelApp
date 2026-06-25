import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsEmail,
  IsArray,
  MaxLength,
  Min,
  Max,
} from "class-validator";

export class CreateAccommodationDto {
  @ApiPropertyOptional({ example: "https://cdn.example.com/hotel.jpg", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiProperty({ example: "Adriatic Paradise Hotel", maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: "hotel", enum: ["hotel", "apartment", "hostel", "villa", "resort", "guesthouse"] })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @ApiPropertyOptional({ example: 120, minimum: 0, description: "Price per night in EUR" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerNight?: number;

  @ApiPropertyOptional({ example: 10, minimum: 0, description: "Available places/slots" })
  @IsOptional()
  @IsInt()
  @Min(0)
  availablePlaces?: number;

  @ApiPropertyOptional({ example: "+36301234567", maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobile?: string;

  @ApiPropertyOptional({ example: "info@adriaticparadise.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 20, minimum: 1, description: "Number of rooms" })
  @IsOptional()
  @IsInt()
  @Min(1)
  roomCount?: number;

  @ApiPropertyOptional({ example: 2, minimum: 1, description: "Max guests per room" })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacityPerAccommodation?: number;

  @ApiPropertyOptional({ example: 4.3, minimum: 0, maximum: 5, description: "Guest rating 0–5" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5, description: "Official star rating" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;

  @ApiPropertyOptional({ example: "Közvetlen tengerparton, medencével és SPA-val..." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Európa", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  continent?: string;

  @ApiPropertyOptional({ example: "Horvátország", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: "Split", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: "Obala Kneza Branimira 8", maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: "Csak felnőtteknek" })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["WiFi", "Medence", "Reggeli", "Parkoló"],
    description: "List of services/amenities",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}
