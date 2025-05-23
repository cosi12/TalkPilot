import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcryptjs from 'bcryptjs';
import { CreateUserDto } from '../dto/create-user.dto'; // Import DTO
import { UpdateUserDto } from '../dto/update-user.dto'; // Import DTO

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const { username, password, nickname, avatarUrl } = createUserDto;

    const saltRounds = 10; // It's good practice to make this configurable
    const passwordHash = await bcryptjs.hash(password, saltRounds);

    const newUser = this.usersRepository.create({
      username,
      passwordHash,
      nickname,
      avatarUrl,
    });

    try {
      const savedUser = await this.usersRepository.save(newUser);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...result } = savedUser; // Exclude passwordHash from the returned object
      return result;
    } catch (error) {
      if (error instanceof QueryFailedError && error.driverError?.code === '23505') {
        // '23505' is the PostgreSQL error code for unique_violation
        throw new ConflictException('Username already exists.');
      }
      // Log the detailed error for server-side inspection
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Error creating user.');
    }
  }

  async findOneByUsername(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findOneById(id: number): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Merge allowed fields from DTO into the user entity
    if (updateUserDto.nickname !== undefined) {
      user.nickname = updateUserDto.nickname;
    }
    if (updateUserDto.avatarUrl !== undefined) {
      user.avatarUrl = updateUserDto.avatarUrl;
    }
    // Add other updatable fields here if necessary

    const updatedUser = await this.usersRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = updatedUser; // Exclude passwordHash
    return result;
  }
}
// No need to export DTOs from here anymore as they are in separate files.
