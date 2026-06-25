import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class FilterFlightsDto extends PaginationDto {
  @IsOptional() @IsString() fromCode?: string;
  @IsOptional() @IsString() toCode?: string;
  @IsOptional() @IsDateString() departDate?: string;
  @IsOptional() @IsDateString() departDateFrom?: string;
  @IsOptional() @IsDateString() departDateTo?: string;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  minPrice?: number;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  maxPrice?: number;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  maxStops?: number;
  @IsOptional() @IsString() airline?: string;
  @IsOptional() @IsBoolean() isRefundable?: boolean;
  @IsOptional() @IsBoolean() hasBaggage?: boolean;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  minDuration?: number;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  maxDuration?: number;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  minAvailableSeats?: number;
  @IsOptional() @IsString() sortBy?:
    | "price"
    | "duration"
    | "departTime"
    | "arrivalTime";
}
