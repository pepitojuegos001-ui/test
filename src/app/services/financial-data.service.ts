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

export interface MonthlySummary {
  income: number;
  expenses: number;
  netBalance: number;
  savingsRate: number;
  transactionCount: number;
  topCategory: string;
}

export interface DateFilter {
  month: number;
  year: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialDataService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private currentFilterSubject = new BehaviorSubject<DateFilter>({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  public transactions$ = this.transactionsSubject.asObservable();
  public currentFilter$ = this.currentFilterSubject.asObservable();

  private allTransactions: Transaction[] = [];

  constructor() {
    this.generateTransactionData();
    this.applyFilter(this.currentFilterSubject.value);
  }

  /**
   * Generate 12 months of realistic transaction data
   * Each month contains: 1 salary + 6 expense categories with realistic variance
   */
  private generateTransactionData(): void {
    const transactions: Transaction[] = [];
    
    const categories = {
      income: [
        { name: 'Salary', icon: '💰', baseAmount: 4500 }
      ],
      expenses: [
        { name: 'Groceries', icon: '🛒', baseAmount: 350, variance: 100 },
        { name: 'Transportation', icon: '🚗', baseAmount: 280, variance: 80 },
        { name: 'Healthcare', icon: '🏥', baseAmount: 150, variance: 200 },
        { name: 'Entertainment', icon: '🎬', baseAmount: 200, variance: 120 },
        { name: 'Housing', icon: '🏠', baseAmount: 1200, variance: 50 },
        { name: 'Education', icon: '📚', baseAmount: 180, variance: 100 }
      ]
    };

    // Generate data for last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      // Generate salary (income) - fixed on 1st of month
      const salaryVariance = (Math.random() - 0.5) * 200;
      transactions.push({
        id: `${year}-${month}-salary`,
        date: new Date(year, month, 1),
        category: 'Salary',
        type: 'income',
        amount: categories.income[0].baseAmount + salaryVariance,
        description: 'Monthly Salary Payment',
        icon: '💰'
      });

      // Generate expense transactions - random days throughout month
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
  }

  /**
   * Set the current date filter and update filtered transactions
   */
  setDateFilter(filter: DateFilter): void {
    this.currentFilterSubject.next(filter);
    this.applyFilter(filter);
  }

  /**
   * Get current date filter
   */
  getCurrentFilter(): DateFilter {
    return this.currentFilterSubject.value;
  }

  /**
   * Apply date filter to transactions
   */
  private applyFilter(filter: DateFilter): void {
    const filtered = this.allTransactions.filter(t => 
      t.date.getMonth() === filter.month && 
      t.date.getFullYear() === filter.year
    );
    this.transactionsSubject.next(filtered);
  }

  /**
   * Get transactions for a specific month/year
   */
  getTransactionsForPeriod(month: number, year: number): Transaction[] {
    return this.allTransactions.filter(t => 
      t.date.getMonth() === month && 
      t.date.getFullYear() === year
    );
  }

  /**
   * Calculate monthly summary for given transactions
   */
  calculateMonthlySummary(transactions: Transaction[]): MonthlySummary {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = income - expenses;
    const savingsRate = income > 0 ? (netBalance / income * 100) : 0;

    // Find top expense category
    const expensesByCategory: { [key: string]: number } = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    const topCategory = Object.keys(expensesByCategory).length > 0 
      ? Object.keys(expensesByCategory).reduce((a, b) => 
          expensesByCategory[a] > expensesByCategory[b] ? a : b)
      : 'None';

    return {
      income,
      expenses,
      netBalance,
      savingsRate,
      transactionCount: transactions.length,
      topCategory
    };
  }

  /**
   * Calculate trend compared to previous month
   */
  calculateTrend(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100);
  }

  /**
   * Get monthly data for chart visualization (last 6 months)
   */
  getMonthlyChartData(): Array<{month: string, income: number, expenses: number, netBalance: number}> {
    const chartData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const transactions = this.getTransactionsForPeriod(date.getMonth(), date.getFullYear());
      const summary = this.calculateMonthlySummary(transactions);
      
      chartData.push({
        month: monthNames[date.getMonth()],
        income: summary.income,
        expenses: summary.expenses,
        netBalance: summary.netBalance
      });
    }

    return chartData;
  }

  /**
   * Get category distribution data for pie chart
   */
  getCategoryDistribution(transactions: Transaction[]): Array<{category: string, amount: number, percentage: number, color: string}> {
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

  /**
   * Export transactions to CSV format
   */
  exportToCSV(transactions: Transaction[]): string {
    const headers = ['Date', 'Category', 'Type', 'Amount', 'Description'];
    const csvRows = [headers.join(',')];

    transactions.forEach(t => {
      const row = [
        t.date.toISOString().split('T')[0],
        t.category,
        t.type,
        t.amount.toFixed(2),
        `"${t.description}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Get all available years in dataset
   */
  getAvailableYears(): number[] {
    const years = new Set(this.allTransactions.map(t => t.date.getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  }

  /**
   * Format trend percentage
   */
  formatTrend(trend: number): string {
    const arrow = trend >= 0 ? '↗' : '↘';
    return `${arrow} ${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`;
  }
}
