import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AddProductComponent } from '../products/add-product/add-product.component';
import { PriceHistoryComponent } from '../products/price-history/price-history.component';
import { ProductCardComponent } from '../products/product-card/product-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    NavbarComponent,
    ProductCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = signal(true);
  searchQuery = '';
  filterPlatform = 'all';
  sortBy = 'newest';

  get totalProducts(): number {
    return this.products.length;
  }

  get alertsTriggered(): number {
    return this.products.filter((p) => p.isAlertSent).length;
  }

  get priceDrops(): number {
    return this.products.filter(
      (p) => p.originalPrice > 0 && p.currentPrice > 0 && p.currentPrice < p.originalPrice,
    ).length;
  }

  get averageSavings(): number {
    const dropped = this.products.filter(
      (p) => p.originalPrice > 0 && p.currentPrice > 0 && p.currentPrice < p.originalPrice,
    );
    if (dropped.length === 0) return 0;
    const total = dropped.reduce(
      (sum, p) => sum + (p.originalPrice - p.currentPrice),
      0,
    );
    return Math.round(total / dropped.length);
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load products', 'Close', {
          duration: 3000,
          panelClass: 'error-snack',
        });
      },
    });
  }

  applyFilters(): void {
    let result = [...this.products];

    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((p) =>
        p.productName.toLowerCase().includes(query),
      );
    }

    if (this.filterPlatform !== 'all') {
      result = result.filter((p) => p.platform === this.filterPlatform);
    }

    switch (this.sortBy) {
      case 'priceLowHigh':
        result.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case 'biggestDrop':
        result.sort(
          (a, b) =>
            b.originalPrice - b.currentPrice - (a.originalPrice - a.currentPrice),
        );
        break;
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    this.filteredProducts = result;
  }

  openAddProductDialog(): void {
    const ref = this.dialog.open(AddProductComponent, { width: '480px' });
    ref.afterClosed().subscribe((result: Product | undefined) => {
      if (result) {
        this.loadProducts();
        this.snackBar.open('Product added to tracking', 'Close', {
          duration: 3000,
          panelClass: 'success-snack',
        });
      }
    });
  }

  onProductDeleted(productId: string): void {
    this.products = this.products.filter((p) => p._id !== productId);
    this.applyFilters();
  }

  onProductUpdated(product: Product): void {
    this.products = this.products.map((p) =>
      p._id === product._id ? product : p,
    );
    this.applyFilters();
  }

  openPriceHistory(product: Product): void {
    this.dialog.open(PriceHistoryComponent, {
      width: '600px',
      data: { productId: product._id, productName: product.productName },
    });
  }
}
