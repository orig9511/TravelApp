import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { Client } from "pg";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function validateSupabaseConnection(): Promise<void> {
  const logger = new Logger("SupabaseConnection");
  const url = process.env.DATABASE_URL;

  if (!url) {
    logger.warn("DATABASE_URL is not set — skipping connection validation");
    return;
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const res = await client.query(
      "SELECT current_database(), current_user, version()",
    );
    const row = res.rows[0];
    logger.log(`Connected to Supabase ✓`);
    logger.log(`  database : ${row.current_database}`);
    logger.log(`  user     : ${row.current_user}`);
    logger.log(`  ssl      : active`);
    logger.log(`  version  : ${String(row.version).split(",")[0]}`);
  } catch (err) {
    logger.error(`Supabase connection failed: ${(err as Error).message}`);
    logger.error("Check DATABASE_URL and SSL settings. Proceeding anyway...");
  } finally {
    await client.end();
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");

  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4200",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Swagger / OpenAPI ──────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Travel Booking API")
    .setDescription(
      "REST API for the Travel Booking platform.\n\n" +
        "**Auth flow:** call `POST /api/auth/login` → copy the `accessToken` from the response → " +
        'click the **Authorize 🔒** button and paste the token (without "Bearer " prefix).',
    )
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "access-token",
    )
    .addTag("auth", "Registration, login, JWT profile")
    .addTag("offers", "Travel offer CRUD, filtering, analytics")
    .addTag("offer-instances", "Departure date instances per offer")
    .addTag("bookings", "Booking creation and management")
    .addTag("accommodations", "Accommodation CRUD and search")
    .addTag("flights", "Flight search and management")
    .addTag("users", "User profiles and role management")
    .addTag("notifications", "In-app notification system")
    .addTag("favorites", "User favourite offers")
    .addTag("admin", "Admin-only operations (seed, maintenance)")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
  // ──────────────────────────────────────────────────────────────────────────

  await validateSupabaseConnection();

  await app.listen(3000);
  console.log("Backend running on  http://localhost:3000/api");
  console.log("Swagger docs at     http://localhost:3000/docs");
}
bootstrap();
