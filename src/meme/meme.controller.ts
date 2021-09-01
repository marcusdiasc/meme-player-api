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

@Controller('meme')
export class MemeController {
  constructor(private memeService: MemeService) {}

  @Post('/')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async postMeme(
    @GetUser() user: UserDocument,
    @Body('title') name: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.memeService.createMeme(user, name, file);
  }
}
