import {
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import type { Job } from 'bull';
import { NotificationsService } from '../notifications/notifications.service';
import { ProductsService } from '../products/products.service';
import { ScraperService } from '../scraper/scraper.service';
import { SCRAPE_PRODUCT_JOB, SCRAPING_QUEUE } from './queue.constants';

@Processor(SCRAPING_QUEUE)
export class QueueConsumer {
  private readonly logger = new Logger(QueueConsumer.name);

  constructor(
    private readonly scraperService: ScraperService,
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process({ name: SCRAPE_PRODUCT_JOB, concurrency: 2 })
  async handleScrapeJob(job: Job): Promise<void> {
    const { productId, url, platform } = job.data;
    this.logger.log(
      `Processing scrape job for product ${productId}, attempt ${job.attemptsMade + 1}`,
    );
    await job.progress(10);

    const scrapedData = await this.scraperService.scrapeProduct(url, platform);
    await job.progress(60);

    if (scrapedData.currentPrice === 0) {
      this.logger.warn(`Price could not be extracted for ${url}`);
      return;
    }

    const updatedProduct = await this.productsService.updatePriceFromScraper(
      productId,
      scrapedData.currentPrice,
      scrapedData.productName,
      scrapedData.productImage,
    );
    await job.progress(80);

    if (
      updatedProduct.currentPrice <= updatedProduct.desiredPrice &&
      !updatedProduct.isAlertSent
    ) {
      try {
        await this.notificationsService.sendPriceAlert(updatedProduct);
        await this.productsService.markAlertSent(productId, true);
        this.logger.log(`Price alert sent for product ${productId}`);
      } catch (alertError) {
        const message =
          alertError instanceof Error ? alertError.message : String(alertError);
        this.logger.error(
          `Failed to send price alert for ${productId}: ${message}`,
        );
      }
    } else if (
      updatedProduct.currentPrice > updatedProduct.desiredPrice &&
      updatedProduct.isAlertSent
    ) {
      await this.productsService.markAlertSent(productId, false);
    }

    await job.progress(100);
    this.logger.log(
      `Completed scrape job for ${productId}. Price: ${scrapedData.currentPrice}`,
    );
  }

  @OnQueueFailed()
  onJobFailed(job: Job, error: Error): void {
    this.logger.error(
      `Scrape job failed for product ${job.data.productId} after ${job.attemptsMade} attempts: ${error.message}`,
    );
  }

  @OnQueueCompleted()
  onJobCompleted(job: Job): void {
    this.logger.debug(`Job ${job.id} completed successfully`);
  }
}
