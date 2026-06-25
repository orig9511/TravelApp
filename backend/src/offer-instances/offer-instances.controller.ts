import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
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
import { OfferInstancesService } from "./offer-instances.service";
import { CreateOfferInstanceDto } from "./dto/create-offer-instance.dto";
import { UpdateOfferInstanceDto } from "./dto/update-offer-instance.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../users/entities/user.entity";

@ApiTags("offer-instances")
@Controller("offer-instances")
export class OfferInstancesController {
  constructor(private readonly service: OfferInstancesService) {}

  @Get("by-offer/:offerId")
  @ApiOperation({ summary: "Get all departure date instances for an offer" })
  @ApiParam({ name: "offerId", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Array of offer instances with capacity and pricing" })
  findByOffer(@Param("offerId", ParseUUIDPipe) offerId: string) {
    return this.service.findByOffer(offerId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single offer instance by ID" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Offer instance detail" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Create a new departure date instance for an offer" })
  @ApiResponse({ status: 201, description: "Offer instance created" })
  create(@Body() dto: CreateOfferInstanceDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id, user.role);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Update an offer instance (capacity, pricing, dates)" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Offer instance updated" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferInstanceDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.id, user.role);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVERTISER, UserRole.ADMIN)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "[ADVERTISER/ADMIN] Delete an offer instance" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Offer instance deleted" })
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id, user.role);
  }
}
