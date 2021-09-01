import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type MemeDocument = Meme & mongoose.Document;

Schema({ timestamps: true });
export class Meme {
  @Prop({ required: true })
  title: string;

  @Prop()
  memeUrl: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: string;
}

export const MemeSchema = SchemaFactory.createForClass(Meme);
