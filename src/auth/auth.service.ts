import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import SignUpDto from './dto/signup.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import SignInDto from './dto/signin.dto';
import JwtPayload from './interface/jwt-payload.interface';
import AuthResponse from './interface/auth-response.interface';
import { ErrorCode } from '../enum/error-code.enum';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    const { username, email, passwordOne, passwordTwo } = signUpDto;

    if (!this.comparePasswords(passwordOne, passwordTwo)) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.PASSWORD_DIFFERENT,
        message: 'As senhas são diferentes',
        field: 'passwordTwo',
      });
    }

    const user = await this.userService.createUser({
      username,
      email,
      password: passwordOne,
    });

    const token = await this.generateToken(user._id);

    return {
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        likes: user.likes,
        unlikes: user.unlikes,
        favourites: user.favourites,
        uploadedMemes: user.uploadedMemes,
      },
      token,
    };
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    const { username, password } = signInDto;

    const user = await this.userService.getUserByUsername(username);
    if (!user) {
      throw new UnauthorizedException(
        {
          errorCode: ErrorCode.INVALID_USERNAME,
        },
        'nome do usuário inválido',
      );
    }

    const isPwEqual = await this.comparePasswords(
      password,
      user.password,
      true,
    );
    if (!isPwEqual) {
      throw new UnauthorizedException(
        {
          errorCode: ErrorCode.INVALID_PASSWORD,
        },
        'nome do usuário inválido',
      );
    }

    const token = await this.generateToken(user._id);

    return {
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        likes: user.likes,
        unlikes: user.unlikes,
        favourites: user.favourites,
        uploadedMemes: user.uploadedMemes,
      },
      token,
    };
  }

  private async comparePasswords(
    passwordOne,
    passwordTwo,
    isSignin = false,
  ): Promise<boolean> {
    try {
      if (isSignin) {
        return await bcrypt.compare(passwordOne, passwordTwo);
      } else {
        return passwordOne === passwordTwo;
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  private async generateToken(userId: string): Promise<string> {
    const payload: JwtPayload = { userId };
    try {
      return await this.jwtService.sign(payload);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
