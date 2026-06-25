import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { TravelCategory } from "../entities/offer.entity";

export class FilterOffersDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  persons?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  minStars?: number;

  @IsOptional()
  @IsEnum(TravelCategory)
  travelCategory?: TravelCategory;

  @IsOptional()
  @IsDateString()
  travelDate?: string;

  @IsOptional()
  continent?: string;

  @IsOptional()
  createdBy?: string;
}
