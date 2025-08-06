import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil, combineLatest, timer } from 'rxjs';
import { FinancialDataService, DateFilter, Transaction } from '../../services/financial-data.service';
import { ChartService } from '../../services/chart.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart', { static: false }) pieChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private barChart: Chart | null = null;
  private pieChart: Chart | null = null;

  currentFilter: DateFilter = { month: new Date().getMonth(), year: new Date().getFullYear() };
  currentTransactions: Transaction[] = [];
  previousTransactions: Transaction[] = [];
  isLoading = true;

  summaryData = {
    income: 0,
    expenses: 0,
    netBalance: 0
  };

  trends = {
    income: 0,
    expenses: 0,
    balance: 0
  };

  get months(): string[] {
    return this.translationService.getTranslatedMonths();
  }

  years = [2023, 2024];
  username = '';

  constructor(
    private financialDataService: FinancialDataService,
    private chartService: ChartService,
    private authService: AuthService,
    private translationService: TranslationService
  ) { }

  ngOnInit(): void {
    this.subscribeToData();
    this.loadInitialData();
    this.subscribeToLanguageChanges();

    // Get current username
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.username = user?.username || '';
      });
  }

  private subscribeToLanguageChanges(): void {
    this.translationService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Recreate charts with updated language and formatting
        setTimeout(() => {
          this.updateCharts();
        }, 100); // Small delay to ensure translations are loaded
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private subscribeToData(): void {
    combineLatest([
      this.financialDataService.transactions$,
      this.financialDataService.currentFilter$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([transactions, filter]) => {
      this.currentFilter = filter;
      this.currentTransactions = transactions;
      this.loadPreviousMonthData();
      this.calculateSummaryData();
      this.calculateTrends();
      this.updateCharts();
    });
  }

  private loadInitialData(): void {
    this.financialDataService.setDateFilter(this.currentFilter);
  }

  private loadPreviousMonthData(): void {
    const prevMonth = this.currentFilter.month === 0 ? 11 : this.currentFilter.month - 1;
    const prevYear = this.currentFilter.month === 0 ? this.currentFilter.year - 1 : this.currentFilter.year;
    
    this.previousTransactions = this.financialDataService.getTransactionsForPeriod(prevMonth, prevYear);
  }

  private calculateSummaryData(): void {
    const currentSummary = this.financialDataService.calculateMonthlySummary(this.currentTransactions);
    this.summaryData = currentSummary;
  }

  private calculateTrends(): void {
    const previousSummary = this.financialDataService.calculateMonthlySummary(this.previousTransactions);
    
    this.trends.income = this.financialDataService.calculateTrend(this.summaryData.income, previousSummary.income);
    this.trends.expenses = this.financialDataService.calculateTrend(this.summaryData.expenses, previousSummary.expenses);
    this.trends.balance = this.financialDataService.calculateTrend(this.summaryData.netBalance, previousSummary.netBalance);
  }

  private updateCharts(): void {
    setTimeout(() => {
      this.createBarChart();
      this.createPieChart();
    });
  }

  private createBarChart(): void {
    if (this.barChartRef?.nativeElement) {
      if (this.barChart) {
        this.chartService.destroyChart(this.barChart);
      }

      const monthlyData = this.financialDataService.getMonthlyChartData(6);
      
      this.barChart = this.chartService.createBarChart(
        this.barChartRef.nativeElement,
        monthlyData.map(d => d.month),
        monthlyData.map(d => d.income),
        monthlyData.map(d => d.expenses)
      );
    }
  }

  private createPieChart(): void {
    if (this.pieChartRef?.nativeElement) {
      if (this.pieChart) {
        this.chartService.destroyChart(this.pieChart);
      }

      const categoryData = this.financialDataService.getCategoryDistribution(this.currentTransactions);
      
      if (categoryData.length > 0) {
        this.pieChart = this.chartService.createPieChart(
          this.pieChartRef.nativeElement,
          categoryData.map(d => d.category),
          categoryData.map(d => d.amount),
          categoryData.map(d => d.color)
        );
      }
    }
  }

  private destroyCharts(): void {
    this.chartService.destroyChart(this.barChart);
    this.chartService.destroyChart(this.pieChart);
  }

  private updateChartLabels(): void {
    if (this.barChart) {
      this.chartService.updateChartLabels(this.barChart);
    }
    // Note: Pie chart doesn't need label updates as it uses category names
  }

  onMonthChanged(month: number): void {
    this.currentFilter.month = month;
    this.financialDataService.setDateFilter(this.currentFilter);
  }

  onYearChanged(year: number): void {
    this.currentFilter.year = year;
    this.financialDataService.setDateFilter(this.currentFilter);
  }

  get selectedPeriod(): string {
    return `${this.months[this.currentFilter.month]} ${this.currentFilter.year}`;
  }

  get currentMonthSubtitle(): string {
    return `${this.months[this.currentFilter.month]} ${this.currentFilter.year}`;
  }
}
