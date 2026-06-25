import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
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
import { FavoritesService } from "./favorites.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("favorites")
@ApiBearerAuth("access-token")
@Controller("favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: "Get all favourited offers for the current user" })
  @ApiResponse({ status: 200, description: "Array of favourite records" })
  getUserFavorites(@CurrentUser() user: any) {
    return this.service.getUserFavorites(user.id);
  }

  @Post(":offerId/toggle")
  @ApiOperation({ summary: "Toggle favourite status for an offer" })
  @ApiParam({ name: "offerId", type: "string", format: "uuid" })
  @ApiResponse({ status: 201, description: "{ favorited: boolean }" })
  toggle(
    @Param("offerId", ParseUUIDPipe) offerId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.toggle(user.id, offerId);
  }

  @Get(":offerId/check")
  @ApiOperation({
    summary: "Check if the current user has favourited an offer",
  })
  @ApiParam({ name: "offerId", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "{ favorited: boolean }" })
  check(
    @Param("offerId", ParseUUIDPipe) offerId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.isFavorite(user.id, offerId);
  }

  @Delete(":offerId")
  @ApiOperation({ summary: "Remove an offer from favourites" })
  @ApiParam({ name: "offerId", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Favourite removed" })
  remove(
    @Param("offerId", ParseUUIDPipe) offerId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.remove(user.id, offerId);
  }

  @Post("accommodation/:accommodationId/toggle")
  @ApiOperation({ summary: "Toggle favourite status for an accommodation" })
  @ApiParam({ name: "accommodationId", type: "string", format: "uuid" })
  @ApiResponse({ status: 201, description: "{ favorited: boolean }" })
  toggleAccommodation(
    @Param("accommodationId", ParseUUIDPipe) accommodationId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.toggleAccommodation(user.id, accommodationId);
  }

  @Get("accommodation/:accommodationId/check")
  @ApiOperation({
    summary: "Check if the current user has favourited an accommodation",
  })
  @ApiParam({ name: "accommodationId", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "{ favorited: boolean }" })
  checkAccommodation(
    @Param("accommodationId", ParseUUIDPipe) accommodationId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.isAccommodationFavorite(user.id, accommodationId);
  }
}
