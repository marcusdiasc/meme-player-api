import * as mongoose from 'mongoose';
import { User } from 'src/user/schema/user.schema';
export declare type MemeDocument = Meme & mongoose.Document;
export declare class Meme {
    _id: string;
    awsKey: string;
    title: string;
    slug: string;
    memeUrl: string;
    userId: User;
    points: number;
}
export declare const MemeSchema: mongoose.Schema<mongoose.Document<Meme, any, any>, mongoose.Model<mongoose.Document<Meme, any, any>, any, any>, {}>;
