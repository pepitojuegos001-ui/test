import { Component, OnInit } from '@angular/core';

export interface FinancialMovement {
  id: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  description: string;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  netBalance: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentMonthSummary = {
    income: 4850.00,
    expenses: 3240.00,
    netBalance: 1610.00
  };

  monthlyData: MonthlySummary[] = [
    { month: 'Jul', income: 4200, expenses: 3100, netBalance: 1100 },
    { month: 'Aug', income: 4800, expenses: 3400, netBalance: 1400 },
    { month: 'Sep', income: 4350, expenses: 2900, netBalance: 1450 },
    { month: 'Oct', income: 5100, expenses: 3600, netBalance: 1500 },
    { month: 'Nov', income: 4900, expenses: 3300, netBalance: 1600 },
    { month: 'Dec', income: 4850, expenses: 3240, netBalance: 1610 }
  ];

  categoryData: CategoryData[] = [
    { category: 'Food & Dining', amount: 890, percentage: 27.5, color: '#FF6384' },
    { category: 'Transportation', amount: 650, percentage: 20.1, color: '#36A2EB' },
    { category: 'Healthcare', amount: 420, percentage: 13.0, color: '#FFCE56' },
    { category: 'Entertainment', amount: 380, percentage: 11.7, color: '#4BC0C0' },
    { category: 'Utilities', amount: 320, percentage: 9.9, color: '#9966FF' },
    { category: 'Shopping', amount: 290, percentage: 9.0, color: '#FF9F40' },
    { category: 'Others', amount: 290, percentage: 8.8, color: '#FF6384' }
  ];

  selectedPeriod = 'current';
  selectedCategory = 'all';
  selectedYear = new Date().getFullYear();

  ngOnInit(): void {
    // Component initialization
  }

  onFiltersChanged(filters: any): void {
    this.selectedPeriod = filters.period;
    this.selectedCategory = filters.category;
    this.selectedYear = filters.year;
    
    // Here you would typically call a service to fetch filtered data
    console.log('Filters changed:', filters);
  }
}
