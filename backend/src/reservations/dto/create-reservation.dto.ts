import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsDateString,
  Min,
  MaxLength,
  Length,
  Max,
} from "class-validator";

export class CreateReservationDto {
  @IsString() @Length(36, 36) accommodationId: string;
  @IsOptional() @IsString() flightId?: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1000000) price?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) persons?: number;
}
