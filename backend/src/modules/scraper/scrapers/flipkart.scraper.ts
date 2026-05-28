import { BaseScraper, ScrapedData } from './base.scraper';

export class FlipkartScraper extends BaseScraper {
  async scrape(url: string, browser: any): Promise<ScrapedData> {
    let page: any = null;
    try {
      page = await this.getPageContent(url, browser);

      try {
        await page.evaluate(() => {
          const closeBtn =
            document.querySelector('._2KpZ6l._2doB4z') ||
            document.querySelector('._1LKTO3 button') ||
            document.querySelector('._1LKTO3');
          if (closeBtn) (closeBtn as HTMLElement).click();
        });
      } catch {
        // popup may not appear
      }

      const productName: string = await page.evaluate(() => {
        const selectors = ['.B_NuCI', 'h1.yhB1nd', 'h1'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && (el as HTMLElement).innerText.trim()) {
            return (el as HTMLElement).innerText.trim();
          }
        }
        return '';
      });

      const priceText: string = await page.evaluate(() => {
        const selectors = ['._30jeq3._16Jk6d', '._30jeq3', '.CEmiEU ._30jeq3'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && (el as HTMLElement).innerText.trim()) {
            return (el as HTMLElement).innerText.trim();
          }
        }
        return '';
      });

      const productImage: string = await page.evaluate(() => {
        const selectors = [
          '._396cs4._2amPTt._3qGmMb',
          '._2r_T1I',
          'img._396cs4',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.getAttribute('src')) {
            return el.getAttribute('src') as string;
          }
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
