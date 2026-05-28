import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateProductDto,
  PriceHistory,
  Product,
  UpdateProductDto,
} from '../models/product.model';

interface ProductsResponse {
  success: boolean;
  data: { products: Product[]; count: number };
}

interface SingleProductResponse {
  success: boolean;
  data: { product: Product };
  message?: string;
}

interface HistoryResponse {
  success: boolean;
  data: { priceHistory: PriceHistory[]; productName: string };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProducts(): Observable<Product[]> {
    return this.http
      .get<ProductsResponse>(`${this.apiUrl}/products`)
      .pipe(map((res) => res.data.products));
  }

  addProduct(dto: CreateProductDto): Observable<Product> {
    return this.http
      .post<SingleProductResponse>(`${this.apiUrl}/products`, dto)
      .pipe(map((res) => res.data.product));
  }

  updateProduct(id: string, dto: UpdateProductDto): Observable<Product> {
    return this.http
      .patch<SingleProductResponse>(`${this.apiUrl}/products/${id}`, dto)
      .pipe(map((res) => res.data.product));
  }

  deleteProduct(id: string): Observable<void> {
    return this.http
      .delete<{ success: boolean }>(`${this.apiUrl}/products/${id}`)
      .pipe(map(() => undefined));
  }

  getPriceHistory(id: string): Observable<PriceHistory[]> {
    return this.http
      .get<HistoryResponse>(`${this.apiUrl}/products/${id}/history`)
      .pipe(map((res) => res.data.priceHistory));
  }

  refreshProductPrice(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/products/${id}/refresh`,
      {},
    );
  }
}
