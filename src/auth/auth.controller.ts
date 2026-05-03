import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(dto);
    const token = this.authService.signToken(user);

    this.setAuthCookie(res, token);

    return { id: user.id, email: user.email, displayName: user.displayName };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const token = this.authService.signToken(user);

    this.setAuthCookie(res, token);

    return { id: user.id, email: user.email, displayName: user.displayName };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // clear the same cookie name we set in setAuthCookie
    res.clearCookie('auth_token');
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };
  }

  // ---------- Map state for the current user ----------

  @Get('me/map-state')
  @UseGuards(AuthGuard)
  async getMyMapState(@CurrentUser() user: User) {
    // uses AuthService helper we added
    return this.authService.getUserMapState(user.id);
  }

  @Put('me/map-state')
  @UseGuards(AuthGuard)
  async saveMyMapState(@CurrentUser() user: User,
    @Body() body: Record<string, unknown>,
  ) {
    await this.authService.updateUserMapState(user.id, body);
    return { ok: true };
  }

  // ---------- Internal helpers ----------

  private setAuthCookie(res: Response, token: string) {
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/',
    });
  }
}
