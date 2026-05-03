import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async createUser(params: {
    email: string;
    passwordHash: string;
    displayName?: string;
  }): Promise<User> {
    const user = this.userRepo.create({
      id: randomUUID(),
      email: params.email,
      passwordHash: params.passwordHash,
      displayName: params.displayName,
    });

    return this.userRepo.save(user);
  }

  // 🔹 NEW: generic update method, used for lastMapState
  async updateUser(id: string, partial: Partial<User>): Promise<void> {
    const user = await this.findById(id);
    if (user) {
      Object.assign(user, partial);
      await this.userRepo.save(user);
    }
  }
}
