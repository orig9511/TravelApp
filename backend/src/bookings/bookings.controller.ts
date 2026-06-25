import {
  Controller,
  Get,
  Post,
  Patch,
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
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../users/entities/user.entity";
import { BookingStatus } from "./entities/booking.entity";

@ApiTags("bookings")
@ApiBearerAuth("access-token")
@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new booking" })
  @ApiResponse({ status: 201, description: "Booking created (status: pending)" })
  @ApiResponse({ status: 400, description: "Validation error or capacity exceeded" })
  @ApiResponse({ status: 409, description: "Duplicate booking (idempotency key)" })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: any) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get("my")
  @ApiOperation({ summary: "Get bookings for the authenticated user" })
  @ApiResponse({ status: 200, description: "Paginated list of user bookings" })
  findMyBookings(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.bookingsService.findMyBookings(user.id, pagination);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  @ApiOperation({ summary: "[ADMIN/ADVERTISER] Get all bookings" })
  @ApiQuery({ name: "status", enum: BookingStatus, required: false })
  @ApiResponse({ status: 200, description: "Paginated list of all bookings" })
  findAll(
    @Query() pagination: PaginationDto,
    @Query("status") status?: BookingStatus,
    @CurrentUser() user?: any,
  ) {
    const advertiserId =
      user?.role === UserRole.ADVERTISER ? user.id : undefined;
    return this.bookingsService.findAll(pagination, status, advertiserId);
  }

  @Get("offer-stats/:offerId")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  @ApiOperation({ summary: "[ADMIN/ADVERTISER] Get booking stats for an offer" })
  @ApiParam({ name: "offerId", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Booking statistics (confirmed, cancelled, total, occupancy)" })
  getOfferStats(@Param("offerId", ParseUUIDPipe) offerId: string) {
    return this.bookingsService.getOfferStats(offerId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single booking by ID" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Booking detail" })
  @ApiResponse({ status: 403, description: "Access denied" })
  @ApiResponse({ status: 404, description: "Booking not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.bookingsService.findOne(id, user.id, user.role);
  }

  @Patch(":id/confirm")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  @ApiOperation({ summary: "[ADMIN/ADVERTISER] Confirm a pending booking" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Booking confirmed" })
  confirm(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.bookingsService.confirmBooking(id, user.id, user.role);
  }

  @Patch(":id/cancel")
  @ApiOperation({ summary: "Cancel a booking (user cancels own pending booking)" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Booking cancelled" })
  cancelByUser(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.cancelByUser(id, user.id);
  }

  @Patch(":id/admin-cancel")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  @ApiOperation({ summary: "[ADMIN/ADVERTISER] Cancel a booking by admin" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Booking cancelled by admin" })
  cancelByAdmin(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.cancelByAdmin(id, user.id);
  }
}
