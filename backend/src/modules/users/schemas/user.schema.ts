import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, default: null, select: false })
  password: string | null;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String })
  googleId?: string;

  @Prop({ type: String, default: null, select: false })
  refreshToken?: string | null;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: String })
  avatar?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ googleId: 1 }, { sparse: true });
