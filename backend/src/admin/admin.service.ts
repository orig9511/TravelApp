import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  ForbiddenException,
} from "@nestjs/common";
import { runSeed, SeedResult } from "./seed-runner";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private seedInProgress = false;

  async triggerSeed(): Promise<SeedResult> {
    if (process.env.ENABLE_SEED_ENDPOINT !== "true") {
      throw new ForbiddenException(
        "Seed endpoint is disabled in this environment",
      );
    }

    if (this.seedInProgress) {
      throw new ServiceUnavailableException("Seed already in progress");
    }

    this.seedInProgress = true;
    this.logger.log("Seed triggered via admin endpoint");

    try {
      const result = await runSeed((msg) => this.logger.log(msg));
      this.logger.log(`Seed complete — ${result.total} records inserted`);
      return result;
    } catch (err) {
      this.logger.error("Seed failed", (err as Error).message);
      throw err;
    } finally {
      this.seedInProgress = false;
    }
  }
}
