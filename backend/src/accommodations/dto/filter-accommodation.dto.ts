import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  IsArray,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class FilterAccommodationDto extends PaginationDto {
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(5) minRating?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) minStars?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) services?: string[];
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsInt() @Min(1) persons?: number;
}
