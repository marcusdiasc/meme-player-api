"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const jwt_1 = require("@nestjs/jwt");
const error_code_enum_1 = require("../enum/error-code.enum");
const user_service_1 = require("../user/user.service");
let AuthService = class AuthService {
    constructor(userService, jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }
    async signUp(signUpDto) {
        const { username, email, passwordOne, passwordTwo } = signUpDto;
        if (!this.comparePasswords(passwordOne, passwordTwo)) {
            throw new common_1.UnauthorizedException({
                errorCode: error_code_enum_1.ErrorCode.PASSWORD_DIFFERENT,
                message: "passwords doesn't match",
                field: 'passwordTwo',
            });
        }
        if (username.match(/\s/)) {
            throw new common_1.UnauthorizedException({
                errorCode: error_code_enum_1.ErrorCode.SPACE_NOT_ALLOWED,
                message: 'space not allowed',
                field: 'username',
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
    async signIn(signInDto) {
        const { username, password } = signInDto;
        const user = await this.userService.getUserByUsername(username);
        if (!user) {
            throw new common_1.UnauthorizedException({
                errorCode: error_code_enum_1.ErrorCode.INVALID_USERNAME,
                message: 'invalid username',
                field: 'username',
            });
        }
        const isPwEqual = await this.comparePasswords(password, user.password, true);
        if (!isPwEqual) {
            throw new common_1.UnauthorizedException({
                errorCode: error_code_enum_1.ErrorCode.INVALID_PASSWORD,
                message: 'invalid password',
                field: 'password',
            });
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
    async comparePasswords(passwordOne, passwordTwo, isSignin = false) {
        try {
            if (isSignin) {
                return await bcrypt.compare(passwordOne, passwordTwo);
            }
            else {
                return passwordOne === passwordTwo;
            }
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
    }
    async generateToken(userId) {
        const payload = { userId };
        try {
            return await this.jwtService.sign(payload);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map