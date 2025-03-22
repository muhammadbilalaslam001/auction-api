import { Controller, Body, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginResponse {
  access_token: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async signIn(
    @Body() signInDto: { email: string; password: string },
  ): Promise<LoginResponse> {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('register')
  async register(
    @Body() registerDto: { email: string; name: string; password: string },
  ): Promise<null> {
    return this.authService.register(
      registerDto.email,
      registerDto.name,
      registerDto.password,
    );
  }
}
