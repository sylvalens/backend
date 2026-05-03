import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

interface JwtPayload {
  sub: string; // user id
  email: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: Secret;
  private readonly jwtExpiresIn: SignOptions['expiresIn'];

  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    const secretFromEnv = configService.get<string>('JWT_SECRET');
    if (!secretFromEnv) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    this.jwtSecret = secretFromEnv;

    const expiresFromEnv = configService.get<string>('JWT_EXPIRES_IN') ?? '1d';
    this.jwtExpiresIn = expiresFromEnv as SignOptions['expiresIn'];
  }

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.usersService.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
    });
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  signToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const options: SignOptions = {};
    if (this.jwtExpiresIn) {
      options.expiresIn = this.jwtExpiresIn;
    }

    return jwt.sign(payload, this.jwtSecret, options);
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }

  // ---------- Map state helpers ----------

  async getUserMapState(userId: string): Promise<Record<string, unknown> | null> {
    const user = await this.usersService.findById(userId);
    return user?.lastMapState || null;
  }

  async updateUserMapState(userId: string, state: Record<string, unknown>): Promise<void> {
    await this.usersService.updateUser(userId, { lastMapState: state });
  }
}
