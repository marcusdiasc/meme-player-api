import * as mongoose from 'mongoose';
import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Meme } from 'src/meme/schema/meme.schema';

export type UserDocument = User & mongoose.Document;

@Schema()
export class User {
  _id: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meme' }] })
  uploadedMemes: Meme[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meme' }] })
  favourites: Meme[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meme' }] })
  likes: Meme[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meme' }] })
  unlikes: Meme[];
}

export const UserSchema = SchemaFactory.createForClass(User);
