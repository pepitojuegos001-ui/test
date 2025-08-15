import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Transaction {
  id: string;
  date: Date;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  icon: string;
}

export interface IncomeEntry {
  id: string;
  date: string;
  amount: number;
  source: string;
  notes: string;
  createdAt: Date;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  amount: number;
  category: string;
  notes: string;
  createdAt: Date;
}

export interface MonthlySummary {
  income: number;
  expenses: number;
  netBalance: number;
}

export interface DateFilter {
  month: number;
  year: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialDataService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private incomeEntriesSubject = new BehaviorSubject<IncomeEntry[]>([]);
  private expenseEntriesSubject = new BehaviorSubject<ExpenseEntry[]>([]);
  private customCategoriesSubject = new BehaviorSubject<string[]>([]);
  private currentFilterSubject = new BehaviorSubject<DateFilter>({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  public transactions$ = this.transactionsSubject.asObservable();
  public incomeEntries$ = this.incomeEntriesSubject.asObservable();
  public expenseEntries$ = this.expenseEntriesSubject.asObservable();
  public customCategories$ = this.customCategoriesSubject.asObservable();
  public currentFilter$ = this.currentFilterSubject.asObservable();

  private allTransactions: Transaction[] = [];
  private incomeEntries: IncomeEntry[] = [];
  private expenseEntries: ExpenseEntry[] = [];
  private customCategories: string[] = [];

  constructor() {
    this.loadStoredData();
    this.generateSampleTransactions();
    this.applyFilter(this.currentFilterSubject.value);
  }

  // Transaction Data Generation
  private generateSampleTransactions(): void {
    const transactions: Transaction[] = [];
    
    const categories = {
      income: [
        { name: 'Salary', icon: 'attach_money', baseAmount: 4500 }
      ],
      expenses: [
        { name: 'Groceries', icon: 'shopping_cart', baseAmount: 350, variance: 100 },
        { name: 'Transportation', icon: 'directions_car', baseAmount: 280, variance: 80 },
        { name: 'Healthcare', icon: 'local_hospital', baseAmount: 150, variance: 200 },
        { name: 'Entertainment', icon: 'movie', baseAmount: 200, variance: 120 },
        { name: 'Housing', icon: 'home', baseAmount: 1200, variance: 50 },
        { name: 'Education', icon: 'school', baseAmount: 180, variance: 100 }
      ]
    };

    // Generate data for last 24 months
    for (let i = 23; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      // Generate salary
      const salaryVariance = (Math.random() - 0.5) * 200;
      transactions.push({
        id: `${year}-${month}-salary`,
        date: new Date(year, month, 1),
        category: 'Salary',
        type: 'income',
        amount: categories.income[0].baseAmount + salaryVariance,
        description: 'Monthly Salary Payment',
        icon: 'attach_money'
      });

      // Generate expenses
      categories.expenses.forEach((category) => {
        const variance = (Math.random() - 0.5) * category.variance;
        const day = Math.floor(Math.random() * 28) + 1;
        
        transactions.push({
          id: `${year}-${month}-${category.name.toLowerCase()}`,
          date: new Date(year, month, day),
          category: category.name,
          type: 'expense',
          amount: Math.abs(category.baseAmount + variance),
          description: `${category.name} expenses`,
          icon: category.icon
        });
      });
    }

    this.allTransactions = transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    this.transactionsSubject.next(this.allTransactions);
  }

  // Filter Management
  setDateFilter(filter: DateFilter): void {
    this.currentFilterSubject.next(filter);
    this.applyFilter(filter);
  }

  getCurrentFilter(): DateFilter {
    return this.currentFilterSubject.value;
  }

  private applyFilter(filter: DateFilter): void {
    const filtered = this.allTransactions.filter(t => 
      t.date.getMonth() === filter.month && 
      t.date.getFullYear() === filter.year
    );
    this.transactionsSubject.next(filtered);
  }

  // Income Management
  getIncomeEntries(): IncomeEntry[] {
    return this.incomeEntries;
  }

  addIncomeEntry(entry: Omit<IncomeEntry, 'id' | 'createdAt'>): void {
    const newEntry: IncomeEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    this.incomeEntries.push(newEntry);
    this.incomeEntriesSubject.next([...this.incomeEntries]);
    this.saveToLocalStorage();
  }

  updateIncomeEntry(id: string, entry: Partial<IncomeEntry>): void {
    const index = this.incomeEntries.findIndex(e => e.id === id);
    if (index !== -1) {
      this.incomeEntries[index] = { ...this.incomeEntries[index], ...entry };
      this.incomeEntriesSubject.next([...this.incomeEntries]);
      this.saveToLocalStorage();
    }
  }

  deleteIncomeEntry(id: string): void {
    this.incomeEntries = this.incomeEntries.filter(e => e.id !== id);
    this.incomeEntriesSubject.next([...this.incomeEntries]);
    this.saveToLocalStorage();
  }

  // Expense Management
  getExpenseEntries(): ExpenseEntry[] {
    return this.expenseEntries;
  }

  addExpenseEntry(entry: Omit<ExpenseEntry, 'id' | 'createdAt'>): void {
    const newEntry: ExpenseEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    this.expenseEntries.push(newEntry);
    this.expenseEntriesSubject.next([...this.expenseEntries]);
    this.saveToLocalStorage();
  }

  updateExpenseEntry(id: string, entry: Partial<ExpenseEntry>): void {
    const index = this.expenseEntries.findIndex(e => e.id === id);
    if (index !== -1) {
      this.expenseEntries[index] = { ...this.expenseEntries[index], ...entry };
      this.expenseEntriesSubject.next([...this.expenseEntries]);
      this.saveToLocalStorage();
    }
  }

  deleteExpenseEntry(id: string): void {
    this.expenseEntries = this.expenseEntries.filter(e => e.id !== id);
    this.expenseEntriesSubject.next([...this.expenseEntries]);
    this.saveToLocalStorage();
  }

  // Category Management
  getDefaultCategories(): string[] {
    return ['Groceries', 'Transportation', 'Healthcare', 'Entertainment', 'Housing', 'Education'];
  }

  getCustomCategories(): string[] {
    return this.customCategories;
  }

  getAllCategories(): string[] {
    return [...this.getDefaultCategories(), ...this.customCategories];
  }

  addCustomCategory(category: string): void {
    if (!this.getAllCategories().includes(category)) {
      this.customCategories.push(category);
      this.customCategoriesSubject.next([...this.customCategories]);
      this.saveToLocalStorage();
    }
  }

  // Data Analysis
  getTransactionsForPeriod(month: number, year: number): Transaction[] {
    return this.allTransactions.filter(t => 
      t.date.getMonth() === month && 
      t.date.getFullYear() === year
    );
  }

  calculateMonthlySummary(transactions: Transaction[]): MonthlySummary {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      netBalance: income - expenses
    };
  }

  calculateTrend(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100);
  }

  getMonthlyChartData(months: number = 6): Array<{month: string, income: number, expenses: number, netBalance: number}> {
    const chartData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const currentFilter = this.currentFilterSubject.value;
    
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(currentFilter.year, currentFilter.month - i, 1);
      const transactions = this.getTransactionsForPeriod(targetDate.getMonth(), targetDate.getFullYear());
      const summary = this.calculateMonthlySummary(transactions);
      
      chartData.push({
        month: monthNames[targetDate.getMonth()],
        income: summary.income,
        expenses: summary.expenses,
        netBalance: summary.netBalance
      });
    }

    return chartData;
  }

  getCategoryDistribution(transactions: Transaction[]): CategoryData[] {
    const expensesByCategory: { [key: string]: number } = {};
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        return sum + t.amount;
      }, 0);

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    return Object.entries(expensesByCategory)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses * 100) : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Currency service will be injected to avoid circular dependency
  private currencyService?: any;

  // Method to set currency service (called from app initialization)
  setCurrencyService(currencyService: any): void {
    this.currencyService = currencyService;
  }

  // Utility Functions
  formatCurrency(amount: number): string {
    if (this.currencyService) {
      return this.currencyService.formatAmount(amount);
    }

    // Fallback to USD formatting if currency service not available
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  }

  formatTrend(trend: number): string {
    const arrow = trend >= 0 ? '↗' : '↘';
    return `${arrow} ${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
  }

  // Local Storage
  private saveToLocalStorage(): void {
    localStorage.setItem('financialApp_income', JSON.stringify(this.incomeEntries));
    localStorage.setItem('financialApp_expenses', JSON.stringify(this.expenseEntries));
    localStorage.setItem('financialApp_customCategories', JSON.stringify(this.customCategories));
  }

  private loadStoredData(): void {
    const storedIncome = localStorage.getItem('financialApp_income');
    const storedExpenses = localStorage.getItem('financialApp_expenses');
    const storedCategories = localStorage.getItem('financialApp_customCategories');

    if (storedIncome) {
      this.incomeEntries = JSON.parse(storedIncome);
      this.incomeEntriesSubject.next([...this.incomeEntries]);
    }
    if (storedExpenses) {
      this.expenseEntries = JSON.parse(storedExpenses);
      this.expenseEntriesSubject.next([...this.expenseEntries]);
    }
    if (storedCategories) {
      this.customCategories = JSON.parse(storedCategories);
      this.customCategoriesSubject.next([...this.customCategories]);
    }
  }
}
