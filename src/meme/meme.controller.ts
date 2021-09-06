import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { fstat } from 'fs';
import { diskStorage } from 'multer';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { MemeService } from './meme.service';

import fs from 'fs';
import { Meme } from './schema/meme.schema';

@Controller('meme')
export class MemeController {
  constructor(private memeService: MemeService) {}

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async postMeme(
    @GetUser() user: UserDocument,
    @Body('title') title: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Meme> {
    return this.memeService.createMeme(user, title, file);
  }

  @Post('/like')
  @UseGuards(JwtAuthGuard)
  async likeMeme(
    @GetUser() user: UserDocument,
    @Body('memeId') memeId: string,
  ): Promise<void> {
    this.memeService.likeMeme(user, memeId);
  }
}
