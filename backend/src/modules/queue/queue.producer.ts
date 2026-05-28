import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { JobOptions, Queue } from 'bull';
import { SCRAPE_PRODUCT_JOB, SCRAPING_QUEUE } from './queue.constants';

interface ScrapeJobPayload {
  productId: string;
  url: string;
  platform: string;
  userId: string;
}

@Injectable()
export class QueueProducer {
  private readonly logger = new Logger(QueueProducer.name);

  private readonly jobOptions: JobOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
    timeout: 60000,
  };

  constructor(
    @InjectQueue(SCRAPING_QUEUE) private readonly scrapingQueue: Queue,
  ) {}

  async addScrapeJob(payload: ScrapeJobPayload) {
    const job = await this.scrapingQueue.add(
      SCRAPE_PRODUCT_JOB,
      payload,
      this.jobOptions,
    );
    this.logger.log(`Added scrape job for product ${payload.productId}`);
    return job;
  }

  async addBulkScrapeJobs(products: ScrapeJobPayload[]) {
    await this.scrapingQueue.addBulk(
      products.map((product) => ({
        name: SCRAPE_PRODUCT_JOB,
        data: product,
        opts: this.jobOptions,
      })),
    );
    this.logger.log(`Added ${products.length} scrape jobs to queue`);
  }
}
