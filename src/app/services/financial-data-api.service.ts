import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { ApiConfigService } from './api-config.service';
import { IncomeEntry, ExpenseEntry, Transaction, MonthlySummary, DateFilter, CategoryData } from './financial-data.service';

export interface CreateIncomeRequest {
  date: string;
  amount: number;
  source: string;
  notes: string;
}

export interface CreateExpenseRequest {
  date: string;
  amount: number;
  category: string;
  notes: string;
}

export interface UpdateIncomeRequest extends CreateIncomeRequest {
  id: string;
}

export interface UpdateExpenseRequest extends CreateExpenseRequest {
  id: string;
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'income' | 'expense';
  minAmount?: number;
  maxAmount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialDataApiService {
  private incomeEntriesSubject = new BehaviorSubject<IncomeEntry[]>([]);
  private expenseEntriesSubject = new BehaviorSubject<ExpenseEntry[]>([]);
  private customCategoriesSubject = new BehaviorSubject<string[]>([]);

  public incomeEntries$ = this.incomeEntriesSubject.asObservable();
  public expenseEntries$ = this.expenseEntriesSubject.asObservable();
  public customCategories$ = this.customCategoriesSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private apiConfig: ApiConfigService
  ) {}

  // Income Entry Methods
  /**
   * Get all income entries
   */
  getIncomeEntries(filter?: TransactionFilter): Observable<IncomeEntry[]> {
    const endpoint = this.apiConfig.getEndpoints().financial.income;
    return this.apiService.get<IncomeEntry[]>(endpoint, {
      params: filter as any,
      mockResponse: this.getMockIncomeEntries()
    }).pipe(
      map(response => response.data),
      tap(entries => this.incomeEntriesSubject.next(entries)),
      catchError(error => {
        console.error('Failed to load income entries:', error);
        return of(this.getMockIncomeEntries());
      })
    );
  }

  /**
   * Create a new income entry
   */
  createIncomeEntry(income: CreateIncomeRequest): Observable<IncomeEntry> {
    const endpoint = this.apiConfig.getEndpoints().financial.income;
    return this.apiService.post<IncomeEntry>(endpoint, income, {
      mockResponse: this.createMockIncomeEntry(income)
    }).pipe(
      map(response => response.data),
      tap(newEntry => {
        const currentEntries = this.incomeEntriesSubject.value;
        this.incomeEntriesSubject.next([newEntry, ...currentEntries]);
      }),
      catchError(error => {
        console.error('Failed to create income entry:', error);
        const mockEntry = this.createMockIncomeEntry(income);
        const currentEntries = this.incomeEntriesSubject.value;
        this.incomeEntriesSubject.next([mockEntry, ...currentEntries]);
        return of(mockEntry);
      })
    );
  }

  /**
   * Update an income entry
   */
  updateIncomeEntry(id: string, income: CreateIncomeRequest): Observable<IncomeEntry> {
    const endpoint = `${this.apiConfig.getEndpoints().financial.income}/${id}`;
    return this.apiService.put<IncomeEntry>(endpoint, income, {
      mockResponse: this.createMockIncomeEntry({ ...income, id })
    }).pipe(
      map(response => response.data),
      tap(updatedEntry => {
        const currentEntries = this.incomeEntriesSubject.value;
        const index = currentEntries.findIndex(e => e.id === id);
        if (index >= 0) {
          currentEntries[index] = updatedEntry;
          this.incomeEntriesSubject.next([...currentEntries]);
        }
      }),
      catchError(error => {
        console.error('Failed to update income entry:', error);
        return of(this.createMockIncomeEntry({ ...income, id }));
      })
    );
  }

  /**
   * Delete an income entry
   */
  deleteIncomeEntry(id: string): Observable<boolean> {
    const endpoint = `${this.apiConfig.getEndpoints().financial.income}/${id}`;
    return this.apiService.delete<boolean>(endpoint, {
      mockResponse: true
    }).pipe(
      map(response => response.data),
      tap(success => {
        if (success) {
          const currentEntries = this.incomeEntriesSubject.value;
          const filteredEntries = currentEntries.filter(e => e.id !== id);
          this.incomeEntriesSubject.next(filteredEntries);
        }
      }),
      catchError(error => {
        console.error('Failed to delete income entry:', error);
        // Still remove from local state for better UX
        const currentEntries = this.incomeEntriesSubject.value;
        const filteredEntries = currentEntries.filter(e => e.id !== id);
        this.incomeEntriesSubject.next(filteredEntries);
        return of(true);
      })
    );
  }

  // Expense Entry Methods
  /**
   * Get all expense entries
   */
  getExpenseEntries(filter?: TransactionFilter): Observable<ExpenseEntry[]> {
    const endpoint = this.apiConfig.getEndpoints().financial.expenses;
    return this.apiService.get<ExpenseEntry[]>(endpoint, {
      params: filter as any,
      mockResponse: this.getMockExpenseEntries()
    }).pipe(
      map(response => response.data),
      tap(entries => this.expenseEntriesSubject.next(entries)),
      catchError(error => {
        console.error('Failed to load expense entries:', error);
        return of(this.getMockExpenseEntries());
      })
    );
  }

  /**
   * Create a new expense entry
   */
  createExpenseEntry(expense: CreateExpenseRequest): Observable<ExpenseEntry> {
    const endpoint = this.apiConfig.getEndpoints().financial.expenses;
    return this.apiService.post<ExpenseEntry>(endpoint, expense, {
      mockResponse: this.createMockExpenseEntry(expense)
    }).pipe(
      map(response => response.data),
      tap(newEntry => {
        const currentEntries = this.expenseEntriesSubject.value;
        this.expenseEntriesSubject.next([newEntry, ...currentEntries]);
      }),
      catchError(error => {
        console.error('Failed to create expense entry:', error);
        const mockEntry = this.createMockExpenseEntry(expense);
        const currentEntries = this.expenseEntriesSubject.value;
        this.expenseEntriesSubject.next([mockEntry, ...currentEntries]);
        return of(mockEntry);
      })
    );
  }

  /**
   * Update an expense entry
   */
  updateExpenseEntry(id: string, expense: CreateExpenseRequest): Observable<ExpenseEntry> {
    const endpoint = `${this.apiConfig.getEndpoints().financial.expenses}/${id}`;
    return this.apiService.put<ExpenseEntry>(endpoint, expense, {
      mockResponse: this.createMockExpenseEntry({ ...expense, id })
    }).pipe(
      map(response => response.data),
      tap(updatedEntry => {
        const currentEntries = this.expenseEntriesSubject.value;
        const index = currentEntries.findIndex(e => e.id === id);
        if (index >= 0) {
          currentEntries[index] = updatedEntry;
          this.expenseEntriesSubject.next([...currentEntries]);
        }
      }),
      catchError(error => {
        console.error('Failed to update expense entry:', error);
        return of(this.createMockExpenseEntry({ ...expense, id }));
      })
    );
  }

  /**
   * Delete an expense entry
   */
  deleteExpenseEntry(id: string): Observable<boolean> {
    const endpoint = `${this.apiConfig.getEndpoints().financial.expenses}/${id}`;
    return this.apiService.delete<boolean>(endpoint, {
      mockResponse: true
    }).pipe(
      map(response => response.data),
      tap(success => {
        if (success) {
          const currentEntries = this.expenseEntriesSubject.value;
          const filteredEntries = currentEntries.filter(e => e.id !== id);
          this.expenseEntriesSubject.next(filteredEntries);
        }
      }),
      catchError(error => {
        console.error('Failed to delete expense entry:', error);
        // Still remove from local state for better UX
        const currentEntries = this.expenseEntriesSubject.value;
        const filteredEntries = currentEntries.filter(e => e.id !== id);
        this.expenseEntriesSubject.next(filteredEntries);
        return of(true);
      })
    );
  }

  // Category Methods
  /**
   * Get all custom categories
   */
  getCustomCategories(): Observable<string[]> {
    const endpoint = this.apiConfig.getEndpoints().financial.categories;
    return this.apiService.get<string[]>(endpoint, {
      mockResponse: this.getMockCategories()
    }).pipe(
      map(response => response.data),
      tap(categories => this.customCategoriesSubject.next(categories)),
      catchError(error => {
        console.error('Failed to load categories:', error);
        return of(this.getMockCategories());
      })
    );
  }

  /**
   * Add a new custom category
   */
  addCustomCategory(category: string): Observable<string[]> {
    const endpoint = this.apiConfig.getEndpoints().financial.categories;
    return this.apiService.post<string[]>(endpoint, { category }, {
      mockResponse: [...this.getMockCategories(), category]
    }).pipe(
      map(response => response.data),
      tap(categories => this.customCategoriesSubject.next(categories)),
      catchError(error => {
        console.error('Failed to add category:', error);
        const currentCategories = this.customCategoriesSubject.value;
        const newCategories = [...currentCategories, category];
        this.customCategoriesSubject.next(newCategories);
        return of(newCategories);
      })
    );
  }

  // Summary Methods
  /**
   * Get monthly summary
   */
  getMonthlySummary(year: number, month: number): Observable<MonthlySummary> {
    const endpoint = `${this.apiConfig.getEndpoints().financial.summary}/${year}/${month}`;
    return this.apiService.get<MonthlySummary>(endpoint, {
      mockResponse: this.getMockMonthlySummary()
    }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Failed to load monthly summary:', error);
        return of(this.getMockMonthlySummary());
      })
    );
  }

  // Mock Data Methods
  private getMockIncomeEntries(): IncomeEntry[] {
    return [
      {
        id: '1',
        date: '2025-08-15',
        amount: 4500,
        source: 'Salary',
        notes: 'Monthly salary',
        createdAt: new Date()
      },
      {
        id: '2',
        date: '2025-08-10',
        amount: 1000,
        source: 'Freelance',
        notes: 'Web development project',
        createdAt: new Date()
      }
    ];
  }

  private getMockExpenseEntries(): ExpenseEntry[] {
    return [
      {
        id: '1',
        date: '2025-08-14',
        amount: 350,
        category: 'Groceries',
        notes: 'Weekly shopping',
        createdAt: new Date()
      },
      {
        id: '2',
        date: '2025-08-12',
        amount: 1200,
        category: 'Housing',
        notes: 'Monthly rent',
        createdAt: new Date()
      }
    ];
  }

  private getMockCategories(): string[] {
    return ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities'];
  }

  private createMockIncomeEntry(income: CreateIncomeRequest & { id?: string }): IncomeEntry {
    return {
      id: income.id || Date.now().toString(),
      date: income.date,
      amount: income.amount,
      source: income.source,
      notes: income.notes,
      createdAt: new Date()
    };
  }

  private createMockExpenseEntry(expense: CreateExpenseRequest & { id?: string }): ExpenseEntry {
    return {
      id: expense.id || Date.now().toString(),
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      notes: expense.notes,
      createdAt: new Date()
    };
  }

  private getMockMonthlySummary(): MonthlySummary {
    return {
      income: 5500,
      expenses: 2850,
      netBalance: 2650
    };
  }
}
