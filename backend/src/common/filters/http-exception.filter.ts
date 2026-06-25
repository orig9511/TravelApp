import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorCodeMap: Record<number, string> = {
      400: "VALIDATION_ERROR",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE_ENTITY",
    };
    const errorCode = errorCodeMap[status] || "INTERNAL_SERVER_ERROR";
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    if (status === 400) {
      this.logger.warn(
        `400 on ${request.method} ${request.url} — ${JSON.stringify(message)}`,
      );
    } else if (status >= 500) {
      this.logger.error(
        `${status} on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorCode,
      ...(typeof message === "object" &&
      message !== null &&
      "error" in message &&
      (message as { error?: unknown }).error
        ? { validationErrors: (message as { error?: unknown }).error }
        : {}),
      message:
        typeof message === "object" &&
        message !== null &&
        "message" in message &&
        (message as { message?: unknown }).message
          ? (message as { message?: unknown }).message
          : message,
    });
  }
}
