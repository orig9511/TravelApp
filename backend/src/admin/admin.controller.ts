import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/entities/user.entity";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@ApiBearerAuth("access-token")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Post("seed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Trigger database seed (ADMIN only, requires ENABLE_SEED_ENDPOINT=true)",
  })
  @ApiResponse({ status: 200, description: "Seed completed successfully" })
  @ApiResponse({
    status: 403,
    description: "Forbidden — requires ADMIN role or endpoint disabled",
  })
  @ApiResponse({ status: 503, description: "Seed already in progress" })
  async seed() {
    this.logger.warn("POST /admin/seed called");
    const result = await this.adminService.triggerSeed();
    return {
      message: "Seed completed successfully",
      inserted: result,
    };
  }
}
