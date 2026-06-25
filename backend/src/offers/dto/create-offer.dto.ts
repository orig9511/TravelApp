import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from "class-validator";
import { TravelCategory } from "../entities/offer.entity";

export class CreateOfferDto {
  @ApiProperty({ example: "Görögország – Mykonos csomag", maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: "Greece – Mykonos package", maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleEn?: string;

  @ApiPropertyOptional({ example: "Tengerparti nyaralás repülővel és szállással" })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: "Beach holiday with flights and accommodation included" })
  @IsOptional()
  @IsString()
  shortDescriptionEn?: string;

  @ApiPropertyOptional({ example: "7 napos all-inclusive nyaralás a Mykonos-szigeten..." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TravelCategory, example: TravelCategory.FLIGHT })
  @IsOptional()
  @IsEnum(TravelCategory)
  travelCategory?: TravelCategory;

  @ApiPropertyOptional({ example: "Mykonos", maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ example: "Görögország", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: "Európa", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  continent?: string;

  @ApiProperty({ example: 899, minimum: 0, description: "Base price in EUR" })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: "EUR", maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 7, minimum: 1, description: "Trip duration in days" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number;

  @ApiPropertyOptional({ example: 6, minimum: 0, description: "Number of nights" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nights?: number;

  @ApiPropertyOptional({ example: 2, minimum: 1, description: "Max persons per booking" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  persons?: number;

  @ApiPropertyOptional({ example: "Mykonos Bay Resort", maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  hotelName?: string;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  hotelStars?: number;

  @ApiPropertyOptional({ example: "Paradise Beach, Mykonos 84600" })
  @IsOptional()
  @IsString()
  hotelAddress?: string;

  @ApiPropertyOptional({ example: "+30 22890 12345" })
  @IsOptional()
  @IsString()
  hotelPhone?: string;

  @ApiPropertyOptional({ example: "info@mykonosbay.gr" })
  @IsOptional()
  @IsString()
  hotelEmail?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["https://cdn.example.com/img1.jpg"],
    description: "Array of image URLs",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: "2026-06-01", description: "ISO date — travel period start" })
  @IsOptional()
  @IsDateString()
  travelPeriodStart?: string;

  @ApiPropertyOptional({ example: "2026-08-31", description: "ISO date — travel period end" })
  @IsOptional()
  @IsDateString()
  travelPeriodEnd?: string;
}
