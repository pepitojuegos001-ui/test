import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { FinancialDataService, IncomeEntry } from '../../services/financial-data.service';
import { ExportService } from '../../services/export.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.scss']
})
export class IncomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  incomeForm: FormGroup;
  dataSource = new MatTableDataSource<IncomeEntry>();
  displayedColumns: string[] = ['date', 'amount', 'source', 'notes', 'actions'];
  
  allIncomeEntries: IncomeEntry[] = [];
  filteredEntries: IncomeEntry[] = [];
  
  isEditing = false;
  editingId: string | null = null;
  
  // Filter options
  get months(): string[] {
    return this.translationService.getTranslatedMonths();
  }
  years = [2023, 2024];
  get sources(): string[] {
    return [
      this.translationService.instant('INCOME.SALARY'),
      this.translationService.instant('INCOME.FREELANCE'),
      this.translationService.instant('INCOME.INVESTMENTS'),
      this.translationService.instant('INCOME.OTHER')
    ];
  }
  
  // Filter values
  selectedMonth = '';
  selectedYear = '';
  selectedSource = '';

  constructor(
    private fb: FormBuilder,
    private financialDataService: FinancialDataService,
    private exportService: ExportService,
    private dialog: MatDialog,
    private translationService: TranslationService
  ) {
    this.incomeForm = this.createForm();
  }

  ngOnInit(): void {
    // Ensure language is properly loaded on route navigation
    this.translationService.ensureLanguageLoaded();

    this.subscribeToData();
    this.setDefaultDate();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      source: ['', Validators.required],
      notes: ['']
    });
  }

  private subscribeToData(): void {
    this.financialDataService.incomeEntries$
      .pipe(takeUntil(this.destroy$))
      .subscribe(entries => {
        this.allIncomeEntries = entries;
        this.applyFilters();
      });
  }

  private setDefaultDate(): void {
    const today = new Date().toISOString().split('T')[0];
    this.incomeForm.patchValue({ date: today });
  }

  onSubmit(): void {
    if (this.incomeForm.valid) {
      const formValue = this.incomeForm.value;
      
      if (this.isEditing && this.editingId) {
        this.financialDataService.updateIncomeEntry(this.editingId, formValue);
      } else {
        this.financialDataService.addIncomeEntry(formValue);
      }
      
      this.resetForm();
    }
  }

  onEdit(entry: IncomeEntry): void {
    this.isEditing = true;
    this.editingId = entry.id;
    
    this.incomeForm.patchValue({
      date: entry.date,
      amount: entry.amount,
      source: entry.source,
      notes: entry.notes
    });
  }

  onDelete(entry: IncomeEntry): void {
    const confirmMessage = this.translationService.instant('INCOME.DELETE_INCOME') + '?';
    if (confirm(confirmMessage)) {
      this.financialDataService.deleteIncomeEntry(entry.id);
    }
  }

  resetForm(): void {
    this.incomeForm.reset();
    this.isEditing = false;
    this.editingId = null;
    this.setDefaultDate();
  }

  applyFilters(): void {
    this.filteredEntries = this.allIncomeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      
      // Month filter
      if (this.selectedMonth && entryDate.getMonth() !== parseInt(this.selectedMonth)) {
        return false;
      }
      
      // Year filter
      if (this.selectedYear && entryDate.getFullYear() !== parseInt(this.selectedYear)) {
        return false;
      }
      
      // Source filter
      if (this.selectedSource && entry.source !== this.selectedSource) {
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
    this.selectedSource = '';
    this.applyFilters();
  }

  exportToExcel(): void {
    const dataToExport = this.filteredEntries.length > 0 ? this.filteredEntries : this.allIncomeEntries;
    const filename = this.filteredEntries.length > 0 ? 'filtered_income_entries.xlsx' : 'income_entries.xlsx';
    this.exportService.exportIncomeToExcel(dataToExport, filename);
  }

  get formTitle(): string {
    return this.isEditing ?
      this.translationService.instant('INCOME.EDIT_INCOME') :
      this.translationService.instant('INCOME.ADD_INCOME');
  }

  get submitButtonText(): string {
    return this.isEditing ? 'Update Income' : 'Save Income';
  }

  formatCurrency(amount: number): string {
    return this.financialDataService.formatCurrency(amount);
  }
}
