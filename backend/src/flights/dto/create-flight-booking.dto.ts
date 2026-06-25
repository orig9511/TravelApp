import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class FlightBookingContactDto {
  @ApiProperty({ example: "Nagy" })
  @IsString()
  lastName: string;

  @ApiProperty({ example: "Anna" })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: "anna.nagy@example.com" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "+36301234567" })
  @IsOptional()
  @IsString()
  phone?: string;
}

class FlightBookingBaggageDto {
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cabin?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  checked?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class CreateFlightBookingDto {
  @ApiProperty({ example: "uuid-outbound-flight" })
  @IsString()
  outboundFlightId: string;

  @ApiPropertyOptional({ example: "uuid-return-flight" })
  @IsOptional()
  @IsString()
  returnFlightId?: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @ApiPropertyOptional({ type: FlightBookingContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FlightBookingContactDto)
  contact?: FlightBookingContactDto;

  @ApiPropertyOptional({ type: FlightBookingBaggageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FlightBookingBaggageDto)
  baggage?: FlightBookingBaggageDto;

  @ApiPropertyOptional({
    example: "flight-20260511-12345",
    description: "Idempotency key for duplicate-submit protection",
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
