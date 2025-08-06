import { Injectable } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { TranslationService } from './translation.service';

Chart.register(...registerables);

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor(private translationService: TranslationService) { }

  createBarChart(
    canvas: HTMLCanvasElement,
    labels: string[],
    incomeData: number[],
    expenseData: number[]
  ): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context from canvas');
    }

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: this.translationService.instant('DASHBOARD.INCOME'),
            data: incomeData,
            backgroundColor: 'rgba(76, 175, 80, 0.8)',
            borderColor: '#4CAF50',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: this.translationService.instant('DASHBOARD.EXPENSES'),
            data: expenseData,
            backgroundColor: 'rgba(244, 67, 54, 0.8)',
            borderColor: '#F44336',
            borderWidth: 2,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return '$' + (value as number).toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  createPieChart(
    canvas: HTMLCanvasElement,
    labels: string[],
    data: number[],
    colors: string[]
  ): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context from canvas');
    }

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return context.label + ': $' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
              }
            }
          }
        }
      }
    });
  }

  updateBarChart(chart: Chart, labels: string[], incomeData: number[], expenseData: number[]): void {
    chart.data.labels = labels;
    (chart.data.datasets[0].data as number[]) = incomeData;
    (chart.data.datasets[1].data as number[]) = expenseData;
    chart.update();
  }

  updatePieChart(chart: Chart, labels: string[], data: number[]): void {
    chart.data.labels = labels;
    (chart.data.datasets[0].data as number[]) = data;
    chart.update();
  }

  destroyChart(chart: Chart | null): void {
    if (chart) {
      chart.destroy();
    }
  }
}
