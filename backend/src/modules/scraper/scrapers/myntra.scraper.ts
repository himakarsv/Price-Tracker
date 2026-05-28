import { BaseScraper, ScrapedData } from './base.scraper';

export class MyntraScraper extends BaseScraper {
  async scrape(url: string, browser: any): Promise<ScrapedData> {
    let page: any = null;
    try {
      page = await this.getPageContent(url, browser);

      await page
        .waitForSelector('.pdp-title, h1.pdp-name', { timeout: 10000 })
        .catch(() => null);

      const productName: string = await page.evaluate(() => {
        const selectors = ['h1.pdp-name', '.pdp-title'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && (el as HTMLElement).innerText.trim()) {
            return (el as HTMLElement).innerText.trim();
          }
        }
        return '';
      });

      const priceText: string = await page.evaluate(() => {
        const selectors = [
          '.pdp-price strong',
          '.pdp-discount-container .pdp-price strong',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && (el as HTMLElement).innerText.trim()) {
            return (el as HTMLElement).innerText.trim();
          }
        }
        return '';
      });

      const productImage: string = await page.evaluate(() => {
        const el = document.querySelector('img.image-grid-image');
        if (el && el.getAttribute('src')) {
          return el.getAttribute('src') as string;
        }
        return '';
      });

      const currentPrice = this.cleanPrice(priceText);

      return {
        productName: this.truncate(productName || 'Unknown Product', 200),
        currentPrice,
        productImage: productImage || '',
        currency: 'INR',
      };
    } catch {
      return {
        productName: 'Unknown Product',
        currentPrice: 0,
        productImage: '',
        currency: 'INR',
      };
    } finally {
      if (page) await page.close().catch(() => null);
    }
  }
}
