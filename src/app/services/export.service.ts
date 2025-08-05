import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { IncomeEntry, ExpenseEntry } from './financial-data.service';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  exportIncomeToExcel(data: IncomeEntry[], filename: string = 'income_entries.xlsx'): void {
    if (data.length === 0) {
      alert('No income data to export');
      return;
    }

    const exportData = data.map(item => ({
      Date: item.date,
      Amount: item.amount,
      Source: item.source,
      Notes: item.notes || ''
    }));

    this.createExcelFile(exportData, 'Income', filename);
  }

  exportExpensesToExcel(data: ExpenseEntry[], filename: string = 'expense_entries.xlsx'): void {
    if (data.length === 0) {
      alert('No expense data to export');
      return;
    }

    const exportData = data.map(item => ({
      Date: item.date,
      Amount: item.amount,
      Category: item.category,
      Notes: item.notes || ''
    }));

    this.createExcelFile(exportData, 'Expenses', filename);
  }

  exportReportToExcel(
    incomeData: IncomeEntry[], 
    expenseData: ExpenseEntry[], 
    filename: string = 'financial_report.xlsx'
  ): void {
    const allData = [
      ...incomeData.map(item => ({
        Date: item.date,
        Type: 'Income',
        Category: item.source,
        Amount: item.amount,
        Notes: item.notes || ''
      })),
      ...expenseData.map(item => ({
        Date: item.date,
        Type: 'Expense', 
        Category: item.category,
        Amount: item.amount,
        Notes: item.notes || ''
      }))
    ].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

    if (allData.length === 0) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    this.createExcelFile(allData, 'Financial Report', filename);
  }

  private createExcelFile(data: any[], sheetName: string, filename: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }

  exportToCSV(data: any[], filename: string = 'export.csv'): void {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    window.URL.revokeObjectURL(url);
  }
}
