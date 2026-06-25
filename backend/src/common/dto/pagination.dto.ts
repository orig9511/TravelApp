import { IsOptional, IsInt, Min, Max } from "class-validator";

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  constructor(partial?: Partial<PaginationDto>) {
    // SECURITY GUARD: Enforce absolute max limit even if client sends higher
    Object.assign(this, partial);
    if (!this.page || this.page < 1) this.page = 1;
    if (!this.limit || this.limit < 1) this.limit = 20;
    // Hard cap: never allow more than 100 items per request
    if (this.limit > 100) this.limit = 100;
    // Hard cap: prevent pagination attacks with huge page numbers
    if (this.page > 1000000) this.page = 1;
  }

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}
