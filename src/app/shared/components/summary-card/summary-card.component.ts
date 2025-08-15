import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-summary-card',
  templateUrl: './summary-card.component.html',
  styleUrls: ['./summary-card.component.scss']
})
export class SummaryCardComponent {
  @Input() title: string = '';
  @Input() value: number = 0;
  @Input() icon: string = '';
  @Input() type: 'income' | 'expense' | 'balance' = 'balance';
  @Input() subtitle: string = '';
  @Input() trend?: number;

  get cardClass(): string {
    return `summary-card ${this.type}-card`;
  }

  get iconColorClass(): string {
    switch (this.type) {
      case 'income':
        return 'icon-income';
      case 'expense':
        return 'icon-expense';
      case 'balance':
        return this.value >= 0 ? 'icon-income' : 'icon-expense';
      default:
        return 'icon-balance';
    }
  }

  get trendIcon(): string {
    if (!this.trend) return '';
    return this.trend > 0 ? 'trending_up' : 'trending_down';
  }

  get trendClass(): string {
    if (!this.trend) return '';
    return this.trend > 0 ? 'trend-positive' : 'trend-negative';
  }

  get trendText(): string {
    if (!this.trend) return '';
    const sign = this.trend > 0 ? '+' : '';
    return `${sign}${this.trend.toFixed(1)}%`;
  }
}
