import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MemeController } from './meme.controller';
import { MemeService } from './meme.service';
import { Meme, MemeSchema } from './schema/meme.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meme.name, schema: MemeSchema }]),
  ],
  controllers: [MemeController],
  providers: [MemeService],
})
export class MemeModule {}
