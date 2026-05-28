import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { AmazonScraper } from './scrapers/amazon.scraper';
import { BaseScraper, ScrapedData } from './scrapers/base.scraper';
import { FlipkartScraper } from './scrapers/flipkart.scraper';
import { GenericScraper } from './scrapers/generic.scraper';
import { MyntraScraper } from './scrapers/myntra.scraper';

@Injectable()
export class ScraperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScraperService.name);
  private puppeteer: any;
  private browser: any = null;
  private browserLaunchPromise: Promise<any> | null = null;

  private readonly amazonScraper = new AmazonScraper();
  private readonly flipkartScraper = new FlipkartScraper();
  private readonly myntraScraper = new MyntraScraper();
  private readonly genericScraper = new GenericScraper();

  onModuleInit(): void {
    const puppeteerExtra = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    puppeteerExtra.use(StealthPlugin());
    this.puppeteer = puppeteerExtra;
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeBrowser();
  }

  async getBrowser(): Promise<any> {
    if (this.browser && this.browser.isConnected && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.browserLaunchPromise) {
      return this.browserLaunchPromise;
    }

    this.browserLaunchPromise = this.puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    try {
      this.browser = await this.browserLaunchPromise;
      return this.browser;
    } finally {
      this.browserLaunchPromise = null;
    }
  }

  async scrapeProduct(url: string, platform: string): Promise<ScrapedData> {
    const scraper = this.getScraper(platform);
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const browser = await this.getBrowser();
        const result = await scraper.scrape(url, browser);

        if (result.currentPrice > 0) return result;
        if (attempt === maxAttempts) return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Scrape attempt ${attempt} failed for ${url}: ${message}`,
        );

        if (
          message.includes('disconnected') ||
          message.includes('closed')
        ) {
          this.browser = null;
        }

        if (attempt < maxAttempts) {
          await this.delay(2000 * attempt);
        }
      }
    }

    return {
      productName: 'Unknown Product',
      currentPrice: 0,
      productImage: '',
      currency: 'INR',
    };
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to close browser: ${message}`);
      }
      this.browser = null;
    }
  }

  private getScraper(platform: string): BaseScraper {
    switch (platform) {
      case 'amazon':
        return this.amazonScraper;
      case 'flipkart':
        return this.flipkartScraper;
      case 'myntra':
        return this.myntraScraper;
      default:
        return this.genericScraper;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
