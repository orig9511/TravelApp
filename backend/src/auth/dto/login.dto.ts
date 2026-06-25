import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "kovacs.janos@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "titkos123", minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
