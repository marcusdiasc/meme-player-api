import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';

export type MemeDocument = Meme & mongoose.Document;

@Schema({ timestamps: true })
export class Meme {
  @Prop({ required: true })
  title: string;

  @Prop()
  slug: string;

  @Prop()
  memeUrl: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ default: 0 })
  points: number;
}

export const MemeSchema = SchemaFactory.createForClass(Meme);
