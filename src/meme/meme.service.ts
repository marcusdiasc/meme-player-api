import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Meme, MemeDocument } from './schema/meme.schema';
import { UserDocument } from 'src/user/schema/user.schema';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MemeService {
  constructor(@InjectModel(Meme.name) private memeModel: Model<MemeDocument>) {}

  async createMeme(
    user: UserDocument,
    title: string,
    file: Express.Multer.File,
  ): Promise<void> {
    let meme: MemeDocument;
    try {
      meme = await this.memeModel.create({
        title,
        userId: user._id,
      });
    } catch (error) {
      throw new InternalServerErrorException();
    }
    console.log(file);

    const filePath = await this.getFilePath(user._id.toString());
    const fileName = meme._id.toString();
    const fileDir = `${filePath}/${fileName}.mp3`;

    await fs.writeFile(fileDir, file.buffer);
  }

  private async getFilePath(userId: string): Promise<string> {
    const filePath = path.join(process.cwd(), 'public', 'files', userId);
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
}
