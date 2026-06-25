import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsDateString,
  IsBoolean,
  Min,
  MaxLength,
  ValidateNested,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";

class FlightLegDto {
  @IsOptional() @IsString() airline?: string;
  @IsOptional() @IsString() flightNumber?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsString() departureTime?: string;
  @IsOptional() @IsString() arrivalTime?: string;
  @IsOptional() @IsNumber() durationMinutes?: number;
}

class FlightDetailsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FlightLegDto)
  outbound?: FlightLegDto;
  @IsOptional()
  @ValidateNested()
  @Type(() => FlightLegDto)
  return?: FlightLegDto;
  @IsOptional() @IsString() aircraft?: string;
}

class ExtrasCapacityDto {
  @IsOptional() @IsInt() @Min(0) extraBaggage?: number;
  @IsOptional() @IsInt() @Min(0) extraLegroom?: number;
}

class ExtrasAvailableDto {
  @IsOptional() @IsBoolean() extraBaggage?: boolean;
  @IsOptional() @IsBoolean() extraLegroom?: boolean;
}

export class CreateOfferInstanceDto {
  @IsString()
  offerId: string;

  @IsDateString()
  departureDate: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsNumber()
  @Min(0)
  pricePerPerson: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  travelCategory?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FlightDetailsDto)
  flightDetails?: FlightDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExtrasCapacityDto)
  extrasCapacity?: ExtrasCapacityDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExtrasAvailableDto)
  extrasAvailable?: ExtrasAvailableDto;
}
