import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnInit {
  @Input() data: CategoryData[] = [];
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public pieChartType: ChartType = 'doughnut';
  public pieChartLegend = false;
  public pieChartPlugins = [];

  public pieChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: []
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(context.parsed);
            const percentage = this.data[context.dataIndex]?.percentage || 0;
            return `${label}: ${value} (${percentage.toFixed(1)}%)`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  ngOnInit(): void {
    this.updateChartData();
  }

  ngOnChanges(): void {
    this.updateChartData();
  }

  private updateChartData(): void {
    if (!this.data || this.data.length === 0) return;

    this.pieChartData = {
      labels: this.data.map(item => item.category),
      datasets: [
        {
          data: this.data.map(item => item.amount),
          backgroundColor: this.data.map(item => item.color),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 8
        }
      ]
    };

    if (this.chart) {
      this.chart.update();
    }
  }

  getTotalAmount(): number {
    if (!this.data || this.data.length === 0) return 0;
    return this.data.reduce((sum, item) => sum + item.amount, 0);
  }

  getTopCategory(): CategoryData | null {
    if (!this.data || this.data.length === 0) return null;
    return this.data.reduce((prev, current) => 
      prev.amount > current.amount ? prev : current
    );
  }
}
