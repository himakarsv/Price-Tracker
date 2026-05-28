import { BaseScraper, ScrapedData } from './base.scraper';

export class GenericScraper extends BaseScraper {
  async scrape(url: string, browser: any): Promise<ScrapedData> {
    let page: any = null;
    try {
      page = await this.getPageContent(url, browser);

      const priceText: string = await page.evaluate(() => {
        const scripts = Array.from(
          document.querySelectorAll('script[type="application/ld+json"]'),
        );
        for (const script of scripts) {
          try {
            const data = JSON.parse((script as HTMLElement).textContent || '{}');
            const nodes = Array.isArray(data) ? data : [data];
            for (const node of nodes) {
              if (node?.offers) {
                const offers = Array.isArray(node.offers)
                  ? node.offers[0]
                  : node.offers;
                if (offers?.price) return String(offers.price);
              }
              if (node?.price) return String(node.price);
            }
          } catch {
            // ignore malformed JSON-LD
          }
        }

        const selectors = [
          '[itemprop="price"]',
          '.price',
          '#price',
          '.product-price',
          '[class*="price"]',
          '[class*="Price"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            const content =
              el.getAttribute('content') ||
              (el as HTMLElement).innerText ||
              el.textContent ||
              '';
            if (content && /\d/.test(content)) return content.trim();
          }
        }
        return '';
      });

      const productName: string = await page.evaluate(() => {
        if (document.title && document.title.trim()) {
          return document.title.trim();
        }
        const h1 = document.querySelector('h1');
        if (h1 && (h1 as HTMLElement).innerText.trim()) {
          return (h1 as HTMLElement).innerText.trim();
        }
        const named = document.querySelector('[itemprop="name"]');
        if (named && (named as HTMLElement).innerText.trim()) {
          return (named as HTMLElement).innerText.trim();
        }
        return '';
      });

      const productImage: string = await page.evaluate(() => {
        const itemprop = document.querySelector('[itemprop="image"]');
        if (itemprop && itemprop.getAttribute('src')) {
          return itemprop.getAttribute('src') as string;
        }
        const og = document.querySelector('meta[property="og:image"]');
        if (og && og.getAttribute('content')) {
          return og.getAttribute('content') as string;
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
