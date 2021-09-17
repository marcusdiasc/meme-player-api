import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
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
import { convert } from 'url-slug';
import { isAscii } from 'class-validator';

@Injectable()
export class MemeService {
  constructor(
    private configService: ConfigService,
    @InjectModel(Meme.name) private memeModel: Model<MemeDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getMemes(
    search: string,
    order: string,
    page: number,
  ): Promise<{
    memes: Meme[];
    page: number;
    pages: number;
  }> {
    let memes: MemeDocument[] = [];
    const itemsPerPage = 20;
    const currPage = page ? page : 0;
    let pageCount = 1;

    if (search) {
      const decodedSearch = decodeURI(search);
      pageCount = await this.memeModel
        .find({
          title: new RegExp(decodedSearch, 'i'),
        })
        .populate('userId', '_id username')
        .count();
      memes = await this.memeModel
        .find({
          title: new RegExp(decodedSearch, 'i'),
        })
        .populate('userId', '_id username')
        .limit(itemsPerPage)
        .skip(itemsPerPage * currPage);
    } else if (order === 'new') {
      pageCount = await this.memeModel
        .find()
        .populate('userId', '_id username')
        .sort({ createdAt: -1 })
        .count();
      memes = await this.memeModel
        .find()
        .populate('userId', '_id username')
        .sort({ createdAt: -1 })
        .limit(itemsPerPage)
        .skip(itemsPerPage * currPage);
    } else if (order === 'trending') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      pageCount = await this.memeModel
        .find({ createdAt: { $gte: date } })
        .populate('userId', '_id username')
        .sort({ points: -1 })
        .count();
      memes = await this.memeModel
        .find({ createdAt: { $gte: date } })
        .populate('userId', '_id username')
        .sort({ points: -1 })
        .limit(itemsPerPage)
        .skip(itemsPerPage * currPage);
    } else {
      pageCount = await this.memeModel
        .find()
        .populate('userId', '_id username')
        .sort({ points: -1 })
        .count();
      memes = await this.memeModel
        .find()
        .populate('userId', '_id username')
        .sort({ points: -1 })
        .limit(itemsPerPage)
        .skip(itemsPerPage * currPage);
    }

    return {
      memes: memes,
      page: currPage,
      pages: Math.ceil(pageCount / itemsPerPage),
    };
  }

  async getFav(user: UserDocument): Promise<Meme[]> {
    await user.populate('favourites');
    return user.favourites;
  }

  async createMeme(
    user: UserDocument,
    title: string,
    file: Express.Multer.File,
  ): Promise<Meme> {
    const isValidTitle = this.isValidTitle(title);

    if (!isValidTitle) {
      throw new BadRequestException({
        erroCode: ErrorCode.EMPTY_TITLE,
        message: 'title is required',
        field: 'title',
      });
    }

    const isValidExtension = this.isExtensionValid(file);
    if (!isValidExtension) {
      throw new BadRequestException({
        erroCode: ErrorCode.INVALID_FILE_EXTENSION,
        message: 'the meme must be a mp3',
        field: 'file',
      });
    }

    const isValidDuration = await this.isDurationValid(file.buffer);
    if (!isValidDuration) {
      throw new BadRequestException({
        erroCode: ErrorCode.INVALID_FILE_DURATION,
        message: 'The file must be at most 20 seconds long.',
        field: 'file',
      });
    }

    const slug = convert(title);
    const userMemes = (await user.populate('uploadedMemes')).uploadedMemes;
    const isAlreadyCreated = userMemes.find((m) => m.slug === slug);
    if (isAlreadyCreated) {
      throw new BadRequestException({
        erroCode: ErrorCode.ALREADY_CREATED,
        message: 'meme already created',
        field: 'title',
      });
    }

    let meme: MemeDocument;
    try {
      meme = new this.memeModel({ title, userId: user });
      await meme.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }

    meme.slug = slug;

    const filePath = await this.getFilePath(user.username);
    const fileName = slug;
    const fileDir = `${filePath}/${fileName}.mp3`;

    await fs.writeFile(fileDir, file.buffer);

    meme.absPath = `/sounds/${user.username}/${fileName}.mp3`;
    meme.memeUrl = `http://localhost:5000/sounds/${user.username}/${fileName}.mp3`;

    await meme.save();
    user.uploadedMemes.push(meme);
    await user.save();

    return meme.populate('userId', '_id username');
  }

  async deleteMeme(
    user: UserDocument,
    memeId: string,
  ): Promise<{ _id: string }> {
    const meme = await this.memeModel.findById(memeId);

    if (!meme) {
      throw new NotFoundException({
        errorCode: ErrorCode.MEME_DOENST_EXISTS,
      });
    }

    if (meme.userId.toString() !== user._id.toString()) {
      throw new UnauthorizedException({
        errorCode: ErrorCode.ACTION_NOT_ALLOWED,
      });
    }

    const isDeleted = await this.deletefile(meme.absPath);

    if (!isDeleted) {
      throw new InternalServerErrorException();
    }

    user.uploadedMemes = user.uploadedMemes.filter(
      (m) => m._id.toString() !== memeId,
    );

    await this.userModel.updateMany(
      { likes: meme._id },
      {
        $pull: { likes: meme._id },
      },
      { multi: true },
    );
    await this.userModel.updateMany(
      { unlikes: meme._id },
      {
        $pull: { unlikes: meme._id },
      },
      { multi: true },
    );
    await this.userModel.updateMany(
      { favourites: meme._id },
      {
        $pull: { favourites: meme._id },
      },
      { multi: true },
    );

    await meme.delete();
    await user.save();

    return {
      _id: meme._id.toString(),
    };
  }

  async downloadMeme(
    memeId: string,
  ): Promise<{ path: string; filename: string }> {
    const meme = await this.memeModel.findById(memeId);
    return {
      path: meme.absPath,
      filename: meme.slug,
    };
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

  private isValidTitle(title: string): boolean {
    return title.trim() !== '';
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

  private async deletefile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(`./public/${filePath}`);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  private async isDurationValid(buffer: Buffer): Promise<boolean> {
    const maxDuration = +this.configService.get('FILE_MAX_DURATION');

    const duration = await getMP3Duration(buffer);
    console.log(duration);
    if (duration > maxDuration) {
      return false;
    }
    return true;
  }

  private isExtensionValid(file: Express.Multer.File): boolean {
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
