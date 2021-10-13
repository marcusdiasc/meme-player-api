/// <reference types="multer" />
import { UserDocument } from 'src/user/schema/user.schema';
import { MemeService } from './meme.service';
import { Meme } from './schema/meme.schema';
export declare class MemeController {
    private memeService;
    constructor(memeService: MemeService);
    getMemes(search: string, order: string, page: number): Promise<{
        memes: Meme[];
        page: number;
        pages: number;
    }>;
    postMeme(user: UserDocument, title: string, file: Express.Multer.File): Promise<Meme>;
    deleteMeme(user: UserDocument, memeId: string): Promise<{
        _id: string;
    }>;
    downloadMeme(res: any, memeId: any): Promise<void>;
    likeMeme(user: UserDocument, memeId: string): Promise<Meme>;
    unlikeMeme(user: UserDocument, memeId: string): Promise<Meme>;
    addFav(user: UserDocument, memeId: string): Promise<{
        _id: string;
    }>;
}
