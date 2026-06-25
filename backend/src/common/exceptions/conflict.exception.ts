import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * ConflictException - 409 Conflict
 * Used for: capacity exhausted, lock conflicts, idempotency conflicts, duplicate unique keys
 */
export class ConflictException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT);
  }
}
