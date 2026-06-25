import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsDateString,
} from "class-validator";
import { UserRole } from "../../users/entities/user.entity";

export class RegisterDto {
  @ApiProperty({ example: "János", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: "Kovács", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: "kovacs_janos", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  username: string;

  @ApiProperty({ example: "kovacs.janos@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "titkos123", minLength: 6, maxLength: 128 })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ example: "1990-05-15" })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.CUSTOMER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
