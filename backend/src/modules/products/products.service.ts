import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument, detectPlatform } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(userId: string, dto: CreateProductDto): Promise<ProductDocument> {
    const platform = detectPlatform(dto.url);
    const product = new this.productModel({
      userId,
      url: dto.url,
      platform,
      desiredPrice: dto.desiredPrice,
    } as any);
    const saved = await product.save();
    await this.cacheManager.del(`products:${userId}`);
    return saved;
  }

  async findAllByUser(userId: string): Promise<ProductDocument[]> {
    const cacheKey = `products:${userId}`;
    const cached = await this.cacheManager.get<ProductDocument[]>(cacheKey);
    if (cached) return cached;

    const products = await this.productModel
      .find({ userId } as any)
      .sort({ createdAt: -1 })
      .exec();

    await this.cacheManager.set(cacheKey, products, 60000);
    return products;
  }

  async findOne(id: string, userId: string): Promise<ProductDocument> {
    const cacheKey = `product:${id}`;
    const cached = await this.cacheManager.get<ProductDocument>(cacheKey);
    if (cached) return cached;

    const product = await this.productModel
      .findOne({ _id: id, userId } as any)
      .exec();
    if (!product) throw new NotFoundException('Product not found');

    await this.cacheManager.set(cacheKey, product, 120000);
    return product;
  }

  async update(id: string, userId: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ _id: id, userId } as any)
      .exec();
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.productModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    await Promise.all([
      this.cacheManager.del(`products:${userId}`),
      this.cacheManager.del(`product:${id}`),
    ]);

    return updated as ProductDocument;
  }

  async remove(id: string, userId: string): Promise<void> {
    const product = await this.productModel
      .findOne({ _id: id, userId } as any)
      .exec();
    if (!product) throw new NotFoundException('Product not found');

    await this.productModel.findByIdAndDelete(id).exec();
    await Promise.all([
      this.cacheManager.del(`products:${userId}`),
      this.cacheManager.del(`product:${id}`),
    ]);
  }

  async getPriceHistory(id: string, userId: string) {
    const product = await this.productModel
      .findOne({ _id: id, userId } as any)
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return { priceHistory: product.priceHistory, productName: product.productName };
  }

  async updatePriceFromScraper(
    productId: string,
    newPrice: number,
    productName: string,
    productImage: string,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) throw new NotFoundException('Product not found');

    product.currentPrice = newPrice;
    product.lastCheckedAt = new Date();

    if (product.originalPrice === 0) {
      product.originalPrice = newPrice;
    }

    product.priceHistory.push({ price: newPrice, recordedAt: new Date() } as any);

    if (productName && product.productName === 'Fetching...') {
      product.productName = productName;
    }

    if (productImage && product.productImage === '') {
      product.productImage = productImage;
    }

    if (product.priceHistory.length > 90) {
      product.priceHistory = product.priceHistory.slice(-90) as any;
    }

    const saved = await product.save();

    await Promise.all([
      this.cacheManager.del(`product:${productId}`),
      this.cacheManager.del(`products:${String(product.userId)}`),
    ]);

    return saved;
  }

  async markAlertSent(productId: string, sent: boolean): Promise<void> {
    await this.productModel.findByIdAndUpdate(productId, { isAlertSent: sent }).exec();
  }

  async getActiveProducts(): Promise<ProductDocument[]> {
    return this.productModel.find({ isActive: true }).exec();
  }
}
