import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Meme, MemeDocument } from './schema/meme.schema';
import { User, UserDocument } from 'src/user/schema/user.schema';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as getMP3Duration from 'get-mp3-duration';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from 'src/enum/error-code.enum';

@Injectable()
export class MemeService {
  constructor(
    private configService: ConfigService,
    @InjectModel(Meme.name) private memeModel: Model<MemeDocument>,
  ) {}

  async createMeme(
    user: UserDocument,
    title: string,
    file: Express.Multer.File,
  ): Promise<Meme> {
    const isValidExtension = this.isExtensionValid(file);
    if (!isValidExtension) {
      throw new BadRequestException({
        erroCode: ErrorCode.INVALID_FILE_EXTENSION,
      });
    }

    const isValidDuration = await this.isDurationValid(file.buffer);
    if (!isValidDuration) {
      throw new BadRequestException({
        erroCode: ErrorCode.INVALID_FILE_DURATION,
      });
    }

    let meme: MemeDocument;
    try {
      meme = new this.memeModel({ title, userId: user });
      await meme.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    const filePath = await this.getFilePath(user._id.toString());
    const fileName = meme._id.toString();
    const fileDir = `${filePath}/${fileName}.mp3`;

    await fs.writeFile(fileDir, file.buffer);

    meme.memeUrl = `http://localhost:3000/sounds/${user._id.toString()}/${fileName}.mp3`;

    await meme.save();
    user.uploadedMemes.push(meme);
    await user.save();

    return meme.depopulate('userId');
  }

  async likeMeme(user: UserDocument, memeId: string): Promise<void> {
    let meme: MemeDocument;
    try {
      meme = await this.memeModel.findById(memeId);
    } catch (error) {
      throw new InternalServerErrorException();
    }
    if (!meme) {
      throw new InternalServerErrorException({
        errorCode: ErrorCode.MEME_DOENST_EXISTS,
      });
    }

    const memesLiked = user.likes as MemeDocument[];
    const isAlreadyLiked = memesLiked.find((mm) => mm._id === meme._id);
    if (isAlreadyLiked) {
      throw new BadRequestException({
        errorCode: ErrorCode.MEME_ALREADY_LIKED,
      });
    }
    meme.likeCount += 1;
    user.likes.push(meme);

    const memesUnliked = user.unlikes as MemeDocument[];
    const isMemeUnliked = memesUnliked.find((mm) => mm._id === meme._id);
    if (isMemeUnliked) {
      meme.unlikeCount -= 1;
      user.unlikes = memesUnliked.filter((mm) => mm._id !== meme._id);
    }

    await user.save();
    await meme.save();
  }

  private async getFilePath(userId: string): Promise<string> {
    const filePath = path.join(process.cwd(), 'public', 'sounds', userId);
    const exists = await this.pathExists(filePath);
    if (!exists) {
      try {
        await fs.mkdir(filePath);
      } catch (error) {
        throw new InternalServerErrorException();
      }
    }
    return filePath;
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async isDurationValid(buffer: Buffer): Promise<boolean> {
    const maxDuration = +this.configService.get('FILE_MAX_DURATION');
    const duration = await getMP3Duration(buffer);
    if (duration > maxDuration) {
      return false;
    }
    return true;
  }

  private isExtensionValid(file: Express.Multer.File): boolean {
    console.log(file);
    if (file.mimetype !== 'audio/mpeg') {
      return false;
    }

    const fileExtension = file.originalname.split('.').slice(-1)[0];
    if (fileExtension !== 'mp3') {
      return false;
    }

    return true;
  }
}
