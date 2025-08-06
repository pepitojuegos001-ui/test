import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil, combineLatest, timer } from 'rxjs';
import { FinancialDataService, IncomeEntry, ExpenseEntry } from '../../services/financial-data.service';
import { ExportService } from '../../services/export.service';
import { TranslationService } from '../../services/translation.service';
import { LoadingService } from '../../services/loading.service';

interface ReportEntry {
  date: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  notes: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  filtersForm: FormGroup;
  dataSource = new MatTableDataSource<ReportEntry>();
  displayedColumns: string[] = ['date', 'type', 'category', 'amount', 'notes'];
  
  allIncomeEntries: IncomeEntry[] = [];
  allExpenseEntries: ExpenseEntry[] = [];
  filteredData: ReportEntry[] = [];
  isLoading = true;

  summaryStats = {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    transactionCount: 0
  };

  allCategories: string[] = [];

  constructor(
    private fb: FormBuilder,
    private financialDataService: FinancialDataService,
    private exportService: ExportService,
    private translationService: TranslationService,
    private loadingService: LoadingService
  ) {
    this.filtersForm = this.createForm();
  }

  ngOnInit(): void {
    // Ensure language is properly loaded on route navigation
    this.translationService.ensureLanguageLoaded();

    // Initialize with loading delay
    this.initializeWithLoading();
  }

  private initializeWithLoading(): void {
    this.isLoading = true;
    const loadingMessage = this.translationService.translate('REPORTS.LOADING_DATA');

    // Show global loading overlay with reports loading message
    this.loadingService.showWithDelay(loadingMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isLoading = false;
        this.subscribeToData();
        this.loadCategories();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      startDate: [''],
      endDate: [''],
      type: ['all'],
      category: ['all']
    });
  }

  private subscribeToData(): void {
    combineLatest([
      this.financialDataService.incomeEntries$,
      this.financialDataService.expenseEntries$,
      this.financialDataService.customCategories$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([incomeEntries, expenseEntries]) => {
      this.allIncomeEntries = incomeEntries;
      this.allExpenseEntries = expenseEntries;
      this.loadCategories();
    });
  }

  private loadCategories(): void {
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Business', 'Other'];
    const expenseCategories = this.financialDataService.getAllCategories();
    this.allCategories = [...incomeCategories, ...expenseCategories];
  }

  generateReport(): void {
    const loadingMessage = this.translationService.translate('LOADING.GENERATING_REPORT');

    this.loadingService.showWithDelay(loadingMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const filters = this.filtersForm.value;
        let combinedData: ReportEntry[] = [];

        // Combine income and expense data
        const incomeData: ReportEntry[] = this.allIncomeEntries.map(entry => ({
          date: entry.date,
          type: 'Income' as const,
          category: entry.source,
          amount: entry.amount,
          notes: entry.notes || ''
        }));

        const expenseData: ReportEntry[] = this.allExpenseEntries.map(entry => ({
          date: entry.date,
          type: 'Expense' as const,
          category: entry.category,
          amount: entry.amount,
          notes: entry.notes || ''
        }));

        combinedData = [...incomeData, ...expenseData];

        // Apply filters
        this.filteredData = combinedData.filter(item => {
          // Date range filter
          if (filters.startDate && item.date < filters.startDate) {
            return false;
          }
          if (filters.endDate && item.date > filters.endDate) {
            return false;
          }

          // Type filter
          if (filters.type !== 'all') {
            if (filters.type === 'income' && item.type !== 'Income') {
              return false;
            }
            if (filters.type === 'expense' && item.type !== 'Expense') {
              return false;
            }
          }

          // Category filter
          if (filters.category !== 'all' && item.category !== filters.category) {
            return false;
          }

          return true;
        });

        // Sort by date (newest first)
        this.filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Update table
        this.dataSource.data = this.filteredData;

        // Calculate summary statistics
        this.calculateSummaryStats();
      });
  }

  private calculateSummaryStats(): void {
    const income = this.filteredData
      .filter(item => item.type === 'Income')
      .reduce((sum, item) => sum + item.amount, 0);

    const expenses = this.filteredData
      .filter(item => item.type === 'Expense')
      .reduce((sum, item) => sum + item.amount, 0);

    this.summaryStats = {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      transactionCount: this.filteredData.length
    };
  }

  clearFilters(): void {
    this.filtersForm.reset({
      startDate: '',
      endDate: '',
      type: 'all',
      category: 'all'
    });
    this.dataSource.data = [];
    this.filteredData = [];
    this.summaryStats = {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      transactionCount: 0
    };
  }

  exportToExcel(): void {
    if (this.filteredData.length === 0) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    const exportData = this.filteredData.map(item => ({
      Date: item.date,
      Type: item.type,
      Category: item.category,
      Amount: item.amount,
      Notes: item.notes
    }));

    const filename = `financial_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Use generic export method
    this.exportService.exportToCSV(exportData, filename.replace('.xlsx', '.csv'));
  }

  formatCurrency(amount: number): string {
    return this.financialDataService.formatCurrency(amount);
  }

  get hasFiltersApplied(): boolean {
    const values = this.filtersForm.value;
    return values.startDate || values.endDate || values.type !== 'all' || values.category !== 'all';
  }
}
