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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schema/user.schema");
const bcrypt = require("bcryptjs");
const error_code_enum_1 = require("../enum/error-code.enum");
let UserService = class UserService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async createUser(createUserDto) {
        const { username, password, email } = createUserDto;
        const usernameExists = await this.getUserByUsername(username);
        if (usernameExists) {
            throw new common_1.UnauthorizedException({
                errorCode: error_code_enum_1.ErrorCode.USERNAME_EXISTS,
                message: 'username already exists',
                field: 'username',
            });
        }
        const emailExists = await this.getUserByEmail(email);
        if (emailExists) {
            throw new common_1.UnauthorizedException({
                errorCode: error_code_enum_1.ErrorCode.EMAIL_EXISTS,
                message: 'e-mail already used',
                field: 'email',
            });
        }
        const hashedPw = await this.hashPassword(password);
        let user;
        try {
            user = new this.userModel({
                username,
                email,
                password: hashedPw,
            });
            await user.save();
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        return user;
    }
    async getUserByUsername(username) {
        let user;
        try {
            user = await this.userModel.findOne({ username });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        return user;
    }
    async getUserProfile(username) {
        const user = await this.userModel
            .findOne({ username: username }, '-password')
            .populate({
            path: 'uploadedMemes',
            populate: {
                path: 'userId',
                select: { username: 1 },
            },
        })
            .populate({
            path: 'favourites',
            populate: {
                path: 'userId',
                select: { username: 1 },
            },
        });
        return user;
    }
    async findById(userId) {
        const user = await this.userModel.findById(userId, '-password');
        return user;
    }
    async getUserByEmail(email) {
        let user;
        try {
            user = await this.userModel.findOne({ email });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        return user;
    }
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, 10);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
    }
};
UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map