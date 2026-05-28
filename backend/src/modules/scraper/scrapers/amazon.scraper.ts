import { BaseScraper, ScrapedData } from './base.scraper';

export class AmazonScraper extends BaseScraper {
  async scrape(url: string, browser: any): Promise<ScrapedData> {
    let page: any = null;
    try {
      page = await this.getPageContent(url, browser);

      await page
        .waitForSelector('#productTitle, .product-title-word-break', {
          timeout: 10000,
        })
        .catch(() => null);

      const productName: string = await page.evaluate(() => {
        const el = document.querySelector('#productTitle');
        return el ? (el as HTMLElement).innerText.trim() : '';
      });

      const priceText: string = await page.evaluate(() => {
        const selectors = [
          '.a-price .a-offscreen',
          '#priceblock_ourprice',
          '#priceblock_dealprice',
          '#apex_offerDisplay_desktop .a-price .a-offscreen',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && (el as HTMLElement).innerText.trim()) {
            return (el as HTMLElement).innerText.trim();
          }
          if (el && (el as HTMLElement).textContent?.trim()) {
            return (el as HTMLElement).textContent!.trim();
          }
        }
        const whole = document.querySelector('.a-price-whole');
        if (whole) {
          const fraction = document.querySelector('.a-price-fraction');
          const wholeText = (whole as HTMLElement).innerText.trim();
          const fractionText = fraction
            ? (fraction as HTMLElement).innerText.trim()
            : '';
          return fractionText ? `${wholeText}.${fractionText}` : wholeText;
        }
        return '';
      });

      const productImage: string = await page.evaluate(() => {
        const landing = document.querySelector('#landingImage');
        if (landing && landing.getAttribute('src')) {
          return landing.getAttribute('src') as string;
        }
        const imgBlk = document.querySelector('#imgBlkFront');
        if (imgBlk && imgBlk.getAttribute('src')) {
          return imgBlk.getAttribute('src') as string;
        }
        const dynamic = document.querySelector('.a-dynamic-image');
        if (dynamic && dynamic.getAttribute('src')) {
          return dynamic.getAttribute('src') as string;
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
