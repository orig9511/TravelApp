import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy
  extends PassportStrategy(Strategy, "google")
  implements OnModuleInit
{
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || "GOOGLE_OAUTH_NOT_CONFIGURED",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_OAUTH_NOT_CONFIGURED",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ??
        "http://localhost:3000/api/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  onModuleInit(): void {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      this.logger.warn(
        "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth is disabled. " +
          "Set these in backend/.env (get from Google Cloud Console → Credentials → OAuth 2.0 Client ID). " +
          "Authorized redirect URI must be: " +
          (process.env.GOOGLE_CALLBACK_URL ??
            "http://localhost:3000/api/auth/google/callback"),
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, name } = profile;
    const googleUser = {
      googleId: id,
      email: emails?.[0]?.value ?? "",
      firstName: name?.givenName ?? "",
      lastName: name?.familyName ?? "",
    };
    done(null, googleUser);
  }
}
