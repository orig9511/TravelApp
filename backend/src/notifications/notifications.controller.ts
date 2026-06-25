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
import { NotificationsService } from "./notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../users/entities/user.entity";

@ApiTags("notifications")
@ApiBearerAuth("access-token")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get notifications for the authenticated user" })
  @ApiQuery({ name: "limit", type: Number, required: false, example: 20 })
  @ApiQuery({ name: "unreadOnly", type: Boolean, required: false })
  @ApiResponse({ status: 200, description: "List of notifications" })
  getMyNotifications(
    @CurrentUser() user: any,
    @Query("limit") limit: number,
    @Query("unreadOnly") unreadOnly: boolean,
  ) {
    return this.service.getUserNotifications(user.id, limit, unreadOnly);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count for the current user" })
  @ApiResponse({ status: 200, description: "{ count: number }" })
  getUnreadCount(@CurrentUser() user: any) {
    return this.service.getUnreadCount(user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  @ApiOperation({ summary: "[ADMIN/ADVERTISER] Send a notification to a user" })
  @ApiResponse({ status: 201, description: "Notification created" })
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Post("offer-unavailable")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADVERTISER)
  @ApiOperation({
    summary: "[ADMIN/ADVERTISER] Notify all users who favourited an offer that it is unavailable",
  })
  @ApiResponse({ status: 201, description: "{ notified: number }" })
  notifyOfferUnavailable(
    @Body("offerId", ParseUUIDPipe) offerId: string,
    @Body("offerTitle") offerTitle: string,
  ) {
    return this.service.notifyOfferUnavailable(offerId, offerTitle);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  markAsRead(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.markAsRead(id, user.id);
  }

  @Patch("mark-all-read")
  @ApiOperation({ summary: "Mark all notifications as read for the current user" })
  @ApiResponse({ status: 200, description: "All notifications marked as read" })
  markAllAsRead(@CurrentUser() user: any) {
    return this.service.markAllAsRead(user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiResponse({ status: 200, description: "Notification deleted" })
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.id);
  }
}
