export interface PriceHistory {
  price: number;
  recordedAt: string;
}

export interface Product {
  _id: string;
  userId: string;
  url: string;
  platform: 'amazon' | 'flipkart' | 'myntra' | 'meesho' | 'other';
  productName: string;
  productImage: string;
  currentPrice: number;
  desiredPrice: number;
  originalPrice: number;
  currency: string;
  priceHistory: PriceHistory[];
  isAlertSent: boolean;
  isActive: boolean;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  url: string;
  desiredPrice: number;
}

export interface UpdateProductDto {
  desiredPrice?: number;
  isActive?: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    count: number;
  };
}
