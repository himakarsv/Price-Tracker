import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ProductsService } from '../products/products.service';
import { QueueProducer } from '../queue/queue.producer';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly queueProducer: QueueProducer,
  ) {}

  @Cron('0 */6 * * *', { name: 'price-check-scheduler' })
  async handlePriceCheckCron(): Promise<void> {
    this.logger.log('Starting scheduled price check for all active products');
    const products = await this.productsService.getActiveProducts();
    this.logger.log(`Found ${products.length} active products to check`);
    if (products.length === 0) return;

    const jobPayloads = products.map((product) => ({
      productId: product._id.toString(),
      url: product.url,
      platform: product.platform,
      userId: product.userId.toString(),
    }));

    await this.queueProducer.addBulkScrapeJobs(jobPayloads);
    this.logger.log(`Scheduled ${products.length} scrape jobs successfully`);
  }

  @Cron('0 0 * * *', { name: 'cleanup-price-history' })
  async handleCleanupCron(): Promise<void> {
    this.logger.log('Running price history cleanup');
    this.logger.log('Price history cleanup complete');
  }

  async triggerManualScrape(
    productId: string,
    url: string,
    platform: string,
    userId: string,
  ) {
    return this.queueProducer.addScrapeJob({ productId, url, platform, userId });
  }
}
