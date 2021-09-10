import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Meme, MemeDocument } from './schema/meme.schema';
import { UserDocument } from 'src/user/schema/user.schema';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as getMP3Duration from 'get-mp3-duration';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from 'src/enum/error-code.enum';
import { convert } from 'url-slug';

@Injectable()
export class MemeService {
  constructor(
    private configService: ConfigService,
    @InjectModel(Meme.name) private memeModel: Model<MemeDocument>,
  ) {}

  async getMemes(order: string): Promise<Meme[]> {
    if (order) {
      return await this.memeModel
        .find({})
        .populate('userId', '_id username')
        .sort(order);
    }
    return await this.memeModel
      .find()
      .populate('userId', '_id username')
      .sort({ points: -1 });
  }

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

    const slug = convert(title);
    meme.slug = slug;

    const filePath = await this.getFilePath(user.username);
    const fileName = slug;
    const fileDir = `${filePath}/${fileName}.mp3`;

    await fs.writeFile(fileDir, file.buffer);

    meme.memeUrl = `http://localhost:5000/sounds/${user.username}/${fileName}.mp3`;

    await meme.save();
    user.uploadedMemes.push(meme);
    await user.save();

    return meme.populate('userId', '_id username');
  }

  async likeMeme(user: UserDocument, memeId: string): Promise<Meme> {
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
    const isAlreadyLiked = memesLiked.find((mm) => {
      return mm._id.toString() === meme._id.toString();
    });

    if (isAlreadyLiked) {
      meme.points -= 1;
      user.likes = user.likes.filter(
        (mm: MemeDocument) => mm._id.toString() !== memeId.toString(),
      );
    } else {
      meme.points += 1;
      user.likes.push(meme);
      const memesUnliked = user.unlikes as MemeDocument[];
      const isMemeUnliked = memesUnliked.find(
        (mm) => mm._id.toString() === meme._id.toString(),
      );
      if (isMemeUnliked) {
        meme.points += 1;
        user.unlikes = memesUnliked.filter(
          (mm) => mm._id.toString() !== meme._id.toString(),
        );
      }
    }

    await user.save();
    await meme.save();
    return meme.populate('userId', '_id username');
  }

  async unlikeMeme(user: UserDocument, memeId: string): Promise<Meme> {
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

    const memesUnliked = user.unlikes as MemeDocument[];
    const isAlreadyUnliked = memesUnliked.find(
      (mm) => mm._id.toString() === meme._id.toString(),
    );
    if (isAlreadyUnliked) {
      meme.points += 1;
      user.unlikes = user.unlikes.filter(
        (mm: MemeDocument) => mm._id.toString() !== memeId.toString(),
      );
    } else {
      meme.points -= 1;
      user.unlikes.push(meme);

      const memesLiked = user.likes as MemeDocument[];
      const isMemeLiked = memesLiked.find(
        (mm) => mm._id.toString() === meme._id.toString(),
      );
      if (isMemeLiked) {
        meme.points -= 1;
        user.likes = memesLiked.filter(
          (mm) => mm._id.toString() !== meme._id.toString(),
        );
      }
    }

    await user.save();
    await meme.save();
    return meme.populate('userId', '_id username');
  }

  async addFav(user: UserDocument, memeId: string): Promise<{ _id: string }> {
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

    const isAlreadyFav = user.favourites.find(
      (m: MemeDocument) => m._id.toString() === memeId,
    );
    if (isAlreadyFav) {
      user.favourites = user.favourites.filter(
        (m: MemeDocument) => m._id.toString() !== memeId,
      );
    } else {
      user.favourites.push(meme);
    }

    await user.save();

    return { _id: meme._id.toString() };
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
