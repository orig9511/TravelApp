import { PartialType } from "@nestjs/mapped-types";
import { CreateOfferInstanceDto } from "./create-offer-instance.dto";
import { IsOptional, IsInt, Min } from "class-validator";

export class UpdateOfferInstanceDto extends PartialType(
  CreateOfferInstanceDto,
) {
  @IsOptional()
  @IsInt()
  @Min(0)
  availableCapacity?: number;
}
