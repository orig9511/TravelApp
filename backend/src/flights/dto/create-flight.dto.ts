import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsBoolean,
  IsDateString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateFlightDto {
  @IsString() @MaxLength(100) airline: string;
  @IsString() @MaxLength(10) fromCode: string;
  @IsString() @MaxLength(10) toCode: string;
  @IsOptional() @IsString() fromLabel?: string;
  @IsOptional() @IsString() toLabel?: string;
  @IsOptional() @IsString() departAt?: string;
  @IsOptional() @IsDateString() departDate?: string;
  @IsOptional() @IsString() arriveAt?: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsString() @MaxLength(10) currency?: string;
  @IsOptional() @IsInt() @Min(0) stopsCount?: number;
  @IsOptional() @IsInt() @Min(0) durationMinutes?: number;
  @IsOptional() @IsBoolean() isRefundable?: boolean;
  @IsOptional() @IsBoolean() hasBaggage?: boolean;
  @IsOptional() @IsInt() @Min(0) availableSeats?: number;
}
