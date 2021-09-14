import {
  Body,
  Controller,
  HttpCode,
  Post,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Get,
  Param,
  Query,
  Delete,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream, fstat } from 'fs';
import { diskStorage } from 'multer';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { MemeService } from './meme.service';

import { Meme } from './schema/meme.schema';

@Controller('meme')
export class MemeController {
  constructor(private memeService: MemeService) {}

  @Get('/')
  async getMemes(@Query('order') order: string): Promise<Meme[]> {
    return await this.memeService.getMemes(order);
  }

  @Post('/')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async postMeme(
    @GetUser() user: UserDocument,
    @Body('title') title: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Meme> {
    return await this.memeService.createMeme(user, title, file);
  }

  @Delete('/')
  @UseGuards(JwtAuthGuard)
  async deleteMeme(
    @GetUser() user: UserDocument,
    @Body('memeId') memeId: string,
  ): Promise<{ _id: string }> {
    return await this.memeService.deleteMeme(user, memeId);
  }

  @Get('/download/:memeId')
  async downloadMeme(@Res() res, @Param('memeId') memeId) {
    const { path, filename } = await this.memeService.downloadMeme(memeId);
    const file = createReadStream('./public' + path);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${filename}.mp3"`,
    });
    file.pipe(res);
  }

  @Patch('/like')
  @UseGuards(JwtAuthGuard)
  async likeMeme(
    @GetUser() user: UserDocument,
    @Body('memeId') memeId: string,
  ): Promise<Meme> {
    return await this.memeService.likeMeme(user, memeId);
  }

  @Patch('/unlike')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async unlikeMeme(
    @GetUser() user: UserDocument,
    @Body('memeId') memeId: string,
  ): Promise<Meme> {
    return await this.memeService.unlikeMeme(user, memeId);
  }

  @Patch('/fav')
  @UseGuards(JwtAuthGuard)
  async addFav(
    @GetUser() user: UserDocument,
    @Body('memeId') memeId: string,
  ): Promise<{ _id: string }> {
    return await this.memeService.addFav(user, memeId);
  }
}
