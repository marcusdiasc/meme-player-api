/// <reference types="multer" />
import { Model } from 'mongoose';
import { Meme, MemeDocument } from './schema/meme.schema';
import { UserDocument } from 'src/user/schema/user.schema';
import { ConfigService } from '@nestjs/config';
export declare class MemeService {
    private configService;
    private memeModel;
    private userModel;
    constructor(configService: ConfigService, memeModel: Model<MemeDocument>, userModel: Model<UserDocument>);
    getMemes(search: string, order: string, page: number): Promise<{
        memes: Meme[];
        page: number;
        pages: number;
    }>;
    createMeme(user: UserDocument, title: string, file: Express.Multer.File): Promise<Meme>;
    deleteMeme(user: UserDocument, memeId: string): Promise<{
        _id: string;
    }>;
    downloadMeme(memeId: string): Promise<{
        path: string;
        filename: string;
    }>;
    likeMeme(user: UserDocument, memeId: string): Promise<Meme>;
    unlikeMeme(user: UserDocument, memeId: string): Promise<Meme>;
    addFav(user: UserDocument, memeId: string): Promise<{
        _id: string;
    }>;
    private isValidTitle;
    private isDurationValid;
    private isExtensionValid;
}
