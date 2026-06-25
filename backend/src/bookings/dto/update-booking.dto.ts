import { IsEnum, IsOptional, IsString } from "class-validator";
import { BookingStatus } from "../entities/booking.entity";

export class UpdateBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
