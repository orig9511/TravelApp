import { Injectable, Logger } from "@nestjs/common";

export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly enabled = process.env.EMAILS_ENABLED === "true";

  async sendMail(options: MailOptions): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(
        `Email sending disabled (EMAILS_ENABLED=false). Skipped: "${options.subject}" → ${options.to}`,
      );
      return;
    }

    // Wire up your SMTP/SendGrid/SES provider here when EMAILS_ENABLED=true.
    this.logger.log(`Sending email: "${options.subject}" → ${options.to}`);
  }
}
