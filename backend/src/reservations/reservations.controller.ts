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
import { ReservationsService } from "./reservations.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../users/entities/user.entity";

@Controller("reservations")
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: any) {
    return this.service.create(user.id, dto);
  }

  @Get("my")
  findMy(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.service.findMyReservations(user.id, pagination);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Patch(":id/confirm")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  confirm(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.service.confirm(id, user.id, isAdmin);
  }

  @Patch(":id/admin-cancel")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  adminCancel(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.adminCancel(id);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id);
  }
}
