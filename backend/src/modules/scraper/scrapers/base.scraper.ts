export interface ScrapedData {
  productName: string;
  currentPrice: number;
  productImage: string;
  currency: string;
}

export abstract class BaseScraper {
  abstract scrape(url: string, browser: any): Promise<ScrapedData>;

  protected async getPageContent(url: string, browser: any): Promise<any> {
    const page = await browser.newPage();
    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });
      await page.setViewport({ width: 1366, height: 768 });
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await this.randomDelay(1500, 3000);
      return page;
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  protected async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  protected cleanPrice(priceText: string): number {
    if (!priceText) return 0;
    const cleaned = priceText.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  protected truncate(text: string, maxLength: number = 200): string {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  }
}
