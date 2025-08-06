import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { FinancialDataService, ExpenseEntry } from '../../services/financial-data.service';
import { ExportService } from '../../services/export.service';
import { TranslationService } from '../../services/translation.service';
import { AddCategoryDialogComponent } from './add-category-dialog.component';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  expenseForm: FormGroup;
  dataSource = new MatTableDataSource<ExpenseEntry>();
  displayedColumns: string[] = ['date', 'amount', 'category', 'notes', 'actions'];
  
  allExpenseEntries: ExpenseEntry[] = [];
  filteredEntries: ExpenseEntry[] = [];
  allCategories: string[] = [];
  
  isEditing = false;
  editingId: string | null = null;
  
  // Filter options
  get months(): string[] {
    return this.translationService.getTranslatedMonths();
  }
  years = [2023, 2024];
  
  // Filter values
  selectedMonth = '';
  selectedYear = '';
  selectedCategory = '';

  constructor(
    private fb: FormBuilder,
    private financialDataService: FinancialDataService,
    private exportService: ExportService,
    private dialog: MatDialog,
    private translationService: TranslationService
  ) {
    this.expenseForm = this.createForm();
  }

  ngOnInit(): void {
    this.subscribeToData();
    this.setDefaultDate();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      notes: ['']
    });
  }

  private subscribeToData(): void {
    this.financialDataService.expenseEntries$
      .pipe(takeUntil(this.destroy$))
      .subscribe(entries => {
        this.allExpenseEntries = entries;
        this.applyFilters();
      });

    this.financialDataService.customCategories$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCategories();
      });
  }

  private loadCategories(): void {
    this.allCategories = this.financialDataService.getAllCategories();
  }

  private setDefaultDate(): void {
    const today = new Date().toISOString().split('T')[0];
    this.expenseForm.patchValue({ date: today });
  }

  onSubmit(): void {
    if (this.expenseForm.valid) {
      const formValue = this.expenseForm.value;
      
      if (this.isEditing && this.editingId) {
        this.financialDataService.updateExpenseEntry(this.editingId, formValue);
      } else {
        this.financialDataService.addExpenseEntry(formValue);
      }
      
      this.resetForm();
    }
  }

  onEdit(entry: ExpenseEntry): void {
    this.isEditing = true;
    this.editingId = entry.id;
    
    this.expenseForm.patchValue({
      date: entry.date,
      amount: entry.amount,
      category: entry.category,
      notes: entry.notes
    });
  }

  onDelete(entry: ExpenseEntry): void {
    const confirmMessage = this.translationService.instant('EXPENSES.DELETE_EXPENSE') + '?';
    if (confirm(confirmMessage)) {
      this.financialDataService.deleteExpenseEntry(entry.id);
    }
  }

  resetForm(): void {
    this.expenseForm.reset();
    this.isEditing = false;
    this.editingId = null;
    this.setDefaultDate();
  }

  openAddCategoryDialog(): void {
    const dialogRef = this.dialog.open(AddCategoryDialogComponent, {
      width: '400px',
      data: { existingCategories: this.allCategories }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.financialDataService.addCustomCategory(result);
        // Select the new category
        this.expenseForm.patchValue({ category: result });
      }
    });
  }

  applyFilters(): void {
    this.filteredEntries = this.allExpenseEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      
      // Month filter
      if (this.selectedMonth && entryDate.getMonth() !== parseInt(this.selectedMonth)) {
        return false;
      }
      
      // Year filter
      if (this.selectedYear && entryDate.getFullYear() !== parseInt(this.selectedYear)) {
        return false;
      }
      
      // Category filter
      if (this.selectedCategory && entry.category !== this.selectedCategory) {
        return false;
      }
      
      return true;
    });
    
    this.dataSource.data = this.filteredEntries;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedMonth = '';
    this.selectedYear = '';
    this.selectedCategory = '';
    this.applyFilters();
  }

  exportToExcel(): void {
    const dataToExport = this.filteredEntries.length > 0 ? this.filteredEntries : this.allExpenseEntries;
    const filename = this.filteredEntries.length > 0 ? 'filtered_expense_entries.xlsx' : 'expense_entries.xlsx';
    this.exportService.exportExpensesToExcel(dataToExport, filename);
  }

  get formTitle(): string {
    return this.isEditing ? 'Edit Expense Entry' : 'Add New Expense';
  }

  get submitButtonText(): string {
    return this.isEditing ? 'Update Expense' : 'Save Expense';
  }

  formatCurrency(amount: number): string {
    return this.financialDataService.formatCurrency(amount);
  }
}
