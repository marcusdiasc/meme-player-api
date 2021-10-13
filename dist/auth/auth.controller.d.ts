import { AuthService } from './auth.service';
import SignInDto from './dto/signin.dto';
import SignUpDto from './dto/signup.dto';
import AuthResponse from './interface/auth-response.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signUp(signUpDto: SignUpDto): Promise<AuthResponse>;
    signIn(signInDto: SignInDto): Promise<AuthResponse>;
}
