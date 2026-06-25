import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "./entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find({
      order: { createdAt: "DESC" },
    });
    return users.map(this.sanitize);
  }

  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return this.sanitize(user);
  }

  async update(
    id: string,
    requesterId: string,
    dto: UpdateUserDto,
  ): Promise<Partial<User>> {
    if (id !== requesterId) {
      const requester = await this.userRepository.findOne({
        where: { id: requesterId },
      });
      if (requester?.role !== UserRole.ADMIN) {
        throw new ForbiddenException("Cannot update another user's profile");
      }
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    if (dto.username && dto.username !== user.username) {
      const existing = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existing) throw new ConflictException("Username already taken");
    }

    Object.assign(user, {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      username: dto.username ?? user.username,
      dateOfBirth: dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : user.dateOfBirth,
    });

    const saved = await this.userRepository.save(user);
    return this.sanitize(saved);
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    user.role = dto.role;
    const saved = await this.userRepository.save(user);
    return this.sanitize(saved);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    await this.userRepository.remove(user);
  }

  private sanitize(user: User): Partial<User> {
    const { passwordHash: _pw, ...rest } = user as any;
    return rest;
  }
}
