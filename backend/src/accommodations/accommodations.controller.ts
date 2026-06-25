import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AccommodationsService } from "./accommodations.service";
import { CreateAccommodationDto } from "./dto/create-accommodation.dto";
import { FilterAccommodationDto } from "./dto/filter-accommodation.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../users/entities/user.entity";
import { PartialType } from "@nestjs/mapped-types";

class UpdateAccommodationDto extends PartialType(CreateAccommodationDto) {}

@ApiTags("accommodations")
@Controller("accommodations")
export class AccommodationsController {
  constructor(private readonly service: AccommodationsService) {}

  @Get()
  @ApiOperation({ summary: "List accommodations (supports filtering)" })
  @ApiResponse({ status: 200, description: "Paginated accommodation list" })
  findAll(@Query() filter: FilterAccommodationDto) {
    return this.service.findAll(filter);
  }

  @Get("top-price")
  @ApiOperation({ summary: "Get cheapest N accommodations" })
  @ApiQuery({ name: "limit", type: Number, required: false, example: 5 })
  @ApiResponse({ status: 200, description: "Accommodations sorted by price ascending" })
  getTopByPrice(@Query("limit") limit: number) {
    return this.service.getTopByPrice(limit);
  }

  @Get("city-suggestions")
  @ApiOperation({ summary: "Autocomplete city names" })
  @ApiQuery({ name: "q", type: String, example: "Bud" })
  @ApiResponse({ status: 200, description: "Matching city name strings" })
  getCitySuggestions(@Query("q") q: string) {
    return this.service.getCitySuggestions(q ?? "");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get accommodation by ID" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Accommodation detail" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Register a new accommodation" })
  @ApiResponse({ status: 201, description: "Accommodation created" })
  create(@Body() dto: CreateAccommodationDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Update an accommodation" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Accommodation updated" })
  @ApiResponse({ status: 403, description: "Not the owner" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccommodationDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.id, user.role);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Delete an accommodation" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Accommodation deleted" })
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id, user.role);
  }
}
