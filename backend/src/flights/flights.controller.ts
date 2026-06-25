import {
  Controller,
  Get,
  Post,
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
} from "@nestjs/swagger";
import { FlightsService } from "./flights.service";
import { CreateFlightDto } from "./dto/create-flight.dto";
import { CreateFlightBookingDto } from "./dto/create-flight-booking.dto";
import { FilterFlightsDto } from "./dto/filter-flights.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../users/entities/user.entity";

@ApiTags("flights")
@Controller("flights")
export class FlightsController {
  constructor(private readonly service: FlightsService) {}

  @Get()
  @ApiOperation({ summary: "Search/list flights with automatic fallback" })
  @ApiResponse({
    status: 200,
    description: "Paginated flight list with searchLevel",
  })
  findAll(@Query() filter: FilterFlightsDto) {
    return this.service.findAllWithFallback(filter);
  }

  @Get("discovery")
  @ApiOperation({
    summary:
      "Get discovery flights for page load (cheapest per route, shuffled)",
  })
  @ApiResponse({
    status: 200,
    description: "Up to 12 cheapest available flights, one per route",
  })
  getDiscovery() {
    return this.service.getDiscoveryFlights(12);
  }

  @Get("cheapest-per-destination")
  @ApiOperation({
    summary: "Get cheapest available flight per destination (for packages)",
  })
  @ApiResponse({ status: 200, description: "One cheapest flight per toCode" })
  getCheapestPerDestination() {
    return this.service.getCheapestPerDestination();
  }

  @Get("airports")
  @ApiOperation({ summary: "Search airports by code or city name" })
  @ApiResponse({
    status: 200,
    description: "Matching airport codes and labels",
  })
  searchAirports(@Query("q") q: string) {
    return this.service.searchAirports(q ?? "");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a flight by ID" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Flight detail" })
  @ApiResponse({ status: 404, description: "Not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADMIN/ADVERTISER] Create a new flight" })
  @ApiResponse({ status: 201, description: "Flight created" })
  create(@Body() dto: CreateFlightDto) {
    return this.service.create(dto);
  }

  @Post("bookings")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Create booking from flight search result" })
  @ApiResponse({ status: 201, description: "Flight booking created" })
  @ApiResponse({
    status: 400,
    description: "Validation or seat availability error",
  })
  createFlightBooking(
    @Body() dto: CreateFlightBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createFlightBooking(user.id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADMIN] Delete a flight" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Flight deleted" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
