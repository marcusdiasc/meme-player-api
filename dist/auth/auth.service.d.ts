import SignUpDto from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import SignInDto from './dto/signin.dto';
import AuthResponse from './interface/auth-response.interface';
import { UserService } from 'src/user/user.service';
export declare class AuthService {
    private userService;
    private jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    signUp(signUpDto: SignUpDto): Promise<AuthResponse>;
    signIn(signInDto: SignInDto): Promise<AuthResponse>;
    private comparePasswords;
    private generateToken;
}
