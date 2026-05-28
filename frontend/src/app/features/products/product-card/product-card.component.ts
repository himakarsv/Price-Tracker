import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { EditProductComponent } from '../edit-product/edit-product.component';

@Component({
  selector: 'app-product-card',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    TimeAgoPipe,
  ],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() deleted = new EventEmitter<string>();
  @Output() updated = new EventEmitter<Product>();
  @Output() viewHistory = new EventEmitter<Product>();

  private readonly dialog = inject(MatDialog);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);

  imageError = false;

  openEditDialog(): void {
    const ref = this.dialog.open(EditProductComponent, {
      data: this.product,
      width: '420px',
    });
    ref.afterClosed().subscribe((result: Product | undefined) => {
      if (result) {
        this.product = result;
        this.updated.emit(result);
      }
    });
  }

  confirmDelete(): void {
    const ref = this.snackBar.open(
      `Remove "${this.product.productName}"?`,
      'Delete',
      { duration: 5000 },
    );
    ref.onAction().subscribe(() => {
      this.productService.deleteProduct(this.product._id).subscribe({
        next: () => {
          this.deleted.emit(this.product._id);
          this.snackBar.open('Product removed', 'Close', {
            duration: 3000,
            panelClass: 'success-snack',
          });
        },
        error: () =>
          this.snackBar.open('Failed to remove product', 'Close', {
            duration: 3000,
            panelClass: 'error-snack',
          }),
      });
    });
  }

  triggerRefresh(): void {
    this.productService.refreshProductPrice(this.product._id).subscribe({
      next: (res) =>
        this.snackBar.open(res.message || 'Refresh triggered', 'Close', {
          duration: 3000,
          panelClass: 'success-snack',
        }),
      error: () =>
        this.snackBar.open('Failed to trigger refresh', 'Close', {
          duration: 3000,
          panelClass: 'error-snack',
        }),
    });
  }

  getPlatformIcon(): string {
    switch (this.product.platform) {
      case 'amazon':
        return '🛒';
      case 'flipkart':
        return '🏪';
      case 'myntra':
        return '👗';
      default:
        return '🌐';
    }
  }

  getPriceDropPercent(): number {
    const { originalPrice, currentPrice } = this.product;
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  isPriceAtTarget(): boolean {
    return this.product.currentPrice <= this.product.desiredPrice;
  }
}
