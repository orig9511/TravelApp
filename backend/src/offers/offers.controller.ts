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
import { OffersService } from "./offers.service";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { UpdateOfferDto } from "./dto/update-offer.dto";
import { FilterOffersDto } from "./dto/filter-offers.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../users/entities/user.entity";

@ApiTags("offers")
@Controller("offers")
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  @ApiOperation({ summary: "List all visible offers (supports filtering)" })
  @ApiResponse({ status: 200, description: "Paginated offer list" })
  findAll(@Query() filter: FilterOffersDto) {
    return this.offersService.findAll(filter, false);
  }

  @Get("top/views")
  @ApiOperation({ summary: "Get top N most-viewed offers" })
  @ApiQuery({ name: "limit", type: Number, required: false, example: 5 })
  @ApiResponse({ status: 200, description: "Top offers by view count" })
  getTopByViews(@Query("limit") limit: number) {
    return this.offersService.getTopByViews(limit);
  }

  @Get("top/favorites")
  @ApiOperation({ summary: "Get top N most-favorited offers" })
  @ApiQuery({ name: "limit", type: Number, required: false, example: 5 })
  @ApiResponse({ status: 200, description: "Top offers by favourite count" })
  getTopByFavorites(@Query("limit") limit: number) {
    return this.offersService.getTopByFavorites(limit);
  }

  @Get("my")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "[ADVERTISER/ADMIN] Get own offers including hidden/inactive",
    description:
      "ADVERTISER: returns only offers created by the current user (including hidden). ADMIN: returns all offers.",
  })
  @ApiResponse({ status: 200, description: "Paginated list of own offers" })
  findMine(@Query() filter: FilterOffersDto, @CurrentUser() user: any) {
    if (user.role === UserRole.ADVERTISER) {
      filter.createdBy = user.id;
    }
    return this.offersService.findAll(filter, true);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single offer by ID" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Offer detail" })
  @ApiResponse({ status: 404, description: "Offer not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.offersService.findOne(id);
  }

  @Get(":id/analytics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Get analytics for an offer" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "View and booking analytics" })
  @ApiResponse({ status: 403, description: "ADVERTISER can only view own offer analytics" })
  getAnalytics(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.offersService.getAnalytics(id, user.id, user.role);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Create a new offer" })
  @ApiResponse({ status: 201, description: "Offer created" })
  @ApiResponse({ status: 403, description: "Insufficient role" })
  create(@Body() dto: CreateOfferDto, @CurrentUser() user: any) {
    return this.offersService.create(dto, user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Update an offer" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Offer updated" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
    @CurrentUser() user: any,
  ) {
    return this.offersService.update(id, dto, user.id, user.role);
  }

  @Patch(":id/visibility")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Toggle offer visibility / active state" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Visibility updated" })
  updateVisibility(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { isInactive?: boolean; notShowable?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.offersService.updateVisibility(id, body, user.id, user.role);
  }

  @Post(":id/view")
  @ApiOperation({ summary: "Increment view counter for an offer (fire-and-forget)" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 201, description: "View count incremented" })
  incrementView(@Param("id", ParseUUIDPipe) id: string) {
    return this.offersService.incrementViewCount(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Delete an offer" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Offer deleted" })
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.offersService.remove(id, user.id, user.role);
  }
}
