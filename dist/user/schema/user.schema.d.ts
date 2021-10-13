import * as mongoose from 'mongoose';
import { Meme } from 'src/meme/schema/meme.schema';
export declare type UserDocument = User & mongoose.Document;
export declare class User {
    _id: string;
    username: string;
    email: string;
    password: string;
    uploadedMemes: Meme[];
    favourites: Meme[];
    likes: Meme[];
    unlikes: Meme[];
}
export declare const UserSchema: mongoose.Schema<mongoose.Document<User, any, any>, mongoose.Model<mongoose.Document<User, any, any>, any, any>, {}>;
