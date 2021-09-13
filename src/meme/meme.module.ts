import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User } from 'src/user/schema/user.schema';
import { MemeController } from './meme.controller';
import { MemeService } from './meme.service';
import { Meme, MemeSchema } from './schema/meme.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Meme.name, schema: MemeSchema }]),
  ],
  controllers: [MemeController],
  providers: [MemeService],
})
export class MemeModule {}
