import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '@nestjs/passport'; // Using the generic AuthGuard
import { CreateUserDto } from '../../users/dto/create-user.dto'; // Import DTO
import { LoginUserDto } from '../dto/login-user.dto'; // Import DTO

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt')) // Protect with JWT Auth Guard
  @HttpCode(HttpStatus.OK)
  async logout() {
    // JWT logout is typically handled client-side by discarding the token.
    // This endpoint can be used for server-side session invalidation if using sessions,
    // or to add the token to a blacklist if implementing a more complex JWT invalidation strategy.
    return { message: 'Logged out successfully' };
  }
}
