import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
class PriceHistory {
  @Prop({ required: true })
  price: number;

  @Prop({ default: Date.now })
  recordedAt: Date;
}

const PriceHistorySchema = SchemaFactory.createForClass(PriceHistory);

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ enum: ['amazon', 'flipkart', 'myntra', 'meesho', 'other'], default: 'other' })
  platform: string;

  @Prop({ default: 'Fetching...' })
  productName: string;

  @Prop({ default: '' })
  productImage: string;

  @Prop({ default: 0 })
  currentPrice: number;

  @Prop({ required: true })
  desiredPrice: number;

  @Prop({ default: 0 })
  originalPrice: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ type: [PriceHistorySchema], default: [] })
  priceHistory: PriceHistory[];

  @Prop({ default: false })
  isAlertSent: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastCheckedAt?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ userId: 1, isActive: 1 });

export function detectPlatform(url: string): string {
  if (url.includes('amazon')) return 'amazon';
  if (url.includes('flipkart')) return 'flipkart';
  if (url.includes('myntra')) return 'myntra';
  if (url.includes('meesho')) return 'meesho';
  return 'other';
}
