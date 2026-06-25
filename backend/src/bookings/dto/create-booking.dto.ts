import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
  Length,
} from "class-validator";
import { Type } from "class-transformer";
import { BookingType } from "../entities/booking.entity";

class PassengerDto {
  @ApiProperty({ example: "Kovács János" })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: "+36301234567" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: "Budapest, Fő utca 1." })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: ["passport", "id"], example: "passport" })
  @IsOptional()
  @IsEnum(["passport", "id"])
  documentType?: "passport" | "id";

  @ApiPropertyOptional({ example: "AB123456" })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}

class BookingExtrasDto {
  @ApiPropertyOptional({ example: 1, description: "Number of extra baggage pieces (+50€ each)" })
  @IsOptional()
  @IsInt()
  @Min(0)
  extraBaggage?: number;

  @ApiPropertyOptional({ example: 2, description: "Number of extra legroom seats (+30€ each)" })
  @IsOptional()
  @IsInt()
  @Min(0)
  extraLegroom?: number;
}

export class CreateBookingDto {
  @ApiPropertyOptional({ enum: BookingType, example: BookingType.OFFER })
  @IsOptional()
  @IsEnum(BookingType)
  bookingType?: BookingType;

  @ApiProperty({ example: "uuid-of-offer", description: "Offer UUID" })
  @IsString()
  offerId: string;

  @ApiProperty({ example: "uuid-of-instance", description: "Offer instance (departure date) UUID" })
  @IsString()
  offerInstanceId: string;

  @ApiProperty({ example: 2, minimum: 1, description: "Number of persons" })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ type: [PassengerDto], description: "Required for flight/tour bookings" })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers?: PassengerDto[];

  @ApiPropertyOptional({ type: BookingExtrasDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingExtrasDto)
  extras?: BookingExtrasDto;

  @ApiPropertyOptional({
    example: "client-generated-uuid",
    description: "Idempotency key — prevents duplicate submissions",
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  idempotencyKey?: string;
}
