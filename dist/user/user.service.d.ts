import { Model } from 'mongoose';
import CreateUserDto from './dto/create-user.dto';
import { User, UserDocument } from './schema/user.schema';
export declare class UserService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    createUser(createUserDto: CreateUserDto): Promise<UserDocument>;
    getUserByUsername(username: string): Promise<UserDocument>;
    getUserProfile(username: string): Promise<User>;
    findById(userId: string): Promise<UserDocument>;
    private getUserByEmail;
    private hashPassword;
}
