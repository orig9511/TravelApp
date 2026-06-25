import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User, UserRole } from "../users/entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const existingEmail = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException("Email already in use");
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException("Username already taken");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      username: dto.username,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.CUSTOMER,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
    });

    const saved = await this.userRepository.save(user);
    const token = this.issueToken(saved);

    return { accessToken: token, user: this.sanitize(saved) };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.issueToken(user);
    return { accessToken: token, user: this.sanitize(user) };
  }

  async googleLoginOrRegister(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<{ accessToken: string; user: Partial<User> }> {
    let user = await this.userRepository.findOne({
      where: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        await this.userRepository.save(user);
      }
    } else {
      const username =
        googleUser.email.split("@")[0] +
        "_" +
        Math.random().toString(36).slice(2, 6);
      user = this.userRepository.create({
        googleId: googleUser.googleId,
        email: googleUser.email,
        firstName: googleUser.firstName || "Google",
        lastName: googleUser.lastName || "User",
        username,
        passwordHash: null as any,
        role: UserRole.CUSTOMER,
      });
      await this.userRepository.save(user);
    }

    return { accessToken: this.issueToken(user), user: this.sanitize(user) };
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return this.sanitize(user);
  }

  private issueToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private sanitize(user: User): Partial<User> {
    const { passwordHash: _pw, ...rest } = user as any;
    return rest;
  }
}
