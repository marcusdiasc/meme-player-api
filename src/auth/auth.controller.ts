import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import SignInDto from './dto/signin.dto';
import SignUpDto from './dto/signup.dto';
import AuthResponse from './interface/auth-response.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(signUpDto);
  }

  @Post('/signin')
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(signInDto);
  }
}
