import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ProductService } from '../../../core/services/product.service';

interface PriceHistoryDialogData {
  productId: string;
  productName: string;
}

@Component({
  selector: 'app-price-history',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  templateUrl: './price-history.component.html',
  styleUrl: './price-history.component.scss',
})
export class PriceHistoryComponent implements OnInit {
  private readonly productService = inject(ProductService);
  readonly data = inject<PriceHistoryDialogData>(MAT_DIALOG_DATA);

  readonly isLoading = signal(true);
  readonly hasData = signal(false);

  readonly lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Price (₹)',
        data: [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  readonly lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `₹${value}`,
        },
      },
    },
  };

  ngOnInit(): void {
    this.productService.getPriceHistory(this.data.productId).subscribe({
      next: (history) => {
        if (history.length > 0) {
          this.lineChartData.labels = history.map((h) =>
            new Date(h.recordedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            }),
          );
          this.lineChartData.datasets[0].data = history.map((h) => h.price);
          this.hasData.set(true);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
