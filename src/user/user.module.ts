import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meme, MemeSchema } from 'src/meme/schema/meme.schema';
import { User, UserSchema } from './schema/user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Meme.name, schema: MemeSchema }]),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
