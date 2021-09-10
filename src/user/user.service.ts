import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import CreateUserDto from './dto/create-user.dto';
import { User, UserDocument } from './schema/user.schema';
import * as bcrypt from 'bcryptjs';
import { ErrorCode } from 'src/enum/error-code.enum';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { username, password, email } = createUserDto;

    const usernameExists = await this.getUserByUsername(username);
    if (usernameExists) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.USERNAME_EXISTS,
        message: 'Nome já cadastrado',
        field: 'username',
      });
    }

    const emailExists = await this.getUserByEmail(email);
    if (emailExists) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.EMAIL_EXISTS,
        message: 'Email já cadastrado',
        field: 'email',
      });
    }

    const hashedPw = await this.hashPassword(password);

    let user: UserDocument;
    try {
      user = new this.userModel({
        username,
        email,
        password: hashedPw,
      });
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<UserDocument> {
    let user: UserDocument;

    try {
      user = await this.userModel.findOne({ username });
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return user;
  }

  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId, '-password');
    return user;
  }

  private async getUserByEmail(email: string): Promise<UserDocument> {
    let user: UserDocument;

    try {
      user = await this.userModel.findOne({ email });
    } catch (error) {
      throw new InternalServerErrorException();
    }

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, 10);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
