import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

export interface FilterOptions {
  period: string;
  year: number;
  category: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss']
})
export class FiltersComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<FilterOptions>();

  filterForm: FormGroup;
  
  periodOptions = [
    { value: 'current', label: 'Current Month' },
    { value: 'last3', label: 'Last 3 Months' },
    { value: 'last6', label: 'Last 6 Months' },
    { value: 'last12', label: 'Last 12 Months' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'custom', label: 'Custom Range' }
  ];

  categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'transport', label: 'Transportation' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'others', label: 'Others' }
  ];

  yearOptions: number[] = [];

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      period: ['current'],
      year: [new Date().getFullYear()],
      category: ['all'],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.generateYearOptions();
    this.setupFormSubscription();
    this.emitInitialFilters();
  }

  private generateYearOptions(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.yearOptions.push(i);
    }
  }

  private setupFormSubscription(): void {
    this.filterForm.valueChanges.subscribe(values => {
      this.onFiltersChange();
    });
  }

  private emitInitialFilters(): void {
    this.onFiltersChange();
  }

  onFiltersChange(): void {
    const formValue = this.filterForm.value;
    const filters: FilterOptions = {
      period: formValue.period,
      year: formValue.year,
      category: formValue.category
    };

    if (formValue.period === 'custom' && formValue.startDate && formValue.endDate) {
      filters.dateRange = {
        start: formValue.startDate,
        end: formValue.endDate
      };
    }

    this.filtersChanged.emit(filters);
  }

  resetFilters(): void {
    this.filterForm.reset({
      period: 'current',
      year: new Date().getFullYear(),
      category: 'all',
      startDate: null,
      endDate: null
    });
  }

  get isCustomPeriod(): boolean {
    return this.filterForm.get('period')?.value === 'custom';
  }

  get selectedPeriodLabel(): string {
    const selectedValue = this.filterForm.get('period')?.value;
    const option = this.periodOptions.find(opt => opt.value === selectedValue);
    return option?.label || 'Current Month';
  }

  get selectedCategoryLabel(): string {
    const selectedValue = this.filterForm.get('category')?.value;
    const option = this.categoryOptions.find(opt => opt.value === selectedValue);
    return option?.label || 'All Categories';
  }
}
