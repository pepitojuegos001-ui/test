import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  netBalance: number;
}

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnInit {
  @Input() data: MonthlySummary[] = [];
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
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
            const label = context.dataset.label || '';
            const value = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(context.parsed.y);
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        border: {
          display: false
        },
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          },
          color: '#757575'
        }
      },
      y: {
        beginAtZero: true,
        border: {
          display: false
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#757575',
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value as number);
          }
        }
      }
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

    this.barChartData = {
      labels: this.data.map(item => item.month),
      datasets: [
        {
          label: 'Income',
          data: this.data.map(item => item.income),
          backgroundColor: 'rgba(76, 175, 80, 0.8)',
          borderColor: '#4CAF50',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
          hoverBackgroundColor: 'rgba(76, 175, 80, 0.9)',
          hoverBorderColor: '#388E3C'
        },
        {
          label: 'Expenses',
          data: this.data.map(item => item.expenses),
          backgroundColor: 'rgba(244, 67, 54, 0.8)',
          borderColor: '#F44336',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
          hoverBackgroundColor: 'rgba(244, 67, 54, 0.9)',
          hoverBorderColor: '#D32F2F'
        },
        {
          label: 'Net Balance',
          data: this.data.map(item => item.netBalance),
          backgroundColor: 'rgba(33, 150, 243, 0.8)',
          borderColor: '#2196F3',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
          hoverBackgroundColor: 'rgba(33, 150, 243, 0.9)',
          hoverBorderColor: '#1976D2'
        }
      ]
    };

    if (this.chart) {
      this.chart.update();
    }
  }

  getAverageIncome(): number {
    if (!this.data || this.data.length === 0) return 0;
    return this.data.reduce((sum, item) => sum + item.income, 0) / this.data.length;
  }

  getAverageExpenses(): number {
    if (!this.data || this.data.length === 0) return 0;
    return this.data.reduce((sum, item) => sum + item.expenses, 0) / this.data.length;
  }

  getAverageBalance(): number {
    if (!this.data || this.data.length === 0) return 0;
    return this.data.reduce((sum, item) => sum + item.netBalance, 0) / this.data.length;
  }
}
