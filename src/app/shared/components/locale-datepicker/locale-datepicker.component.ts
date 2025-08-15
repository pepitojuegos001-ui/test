import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LocaleDateService } from '../../../services/locale-date.service';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-locale-datepicker',
  template: `
    <mat-form-field [appearance]="appearance" class="locale-datepicker">
      <mat-label>{{ label | translate }}</mat-label>
      
      <!-- Native date input for cross-browser compatibility -->
      <input 
        matInput 
        type="date"
        [value]="isoValue"
        (input)="onDateInput($event)"
        (blur)="onBlur()"
        [disabled]="disabled"
        [required]="required"
        [min]="minDate"
        [max]="maxDate"
        [placeholder]="placeholder"
        #dateInput>
      
      <!-- Display formatted date -->
      <div class="formatted-date-display" *ngIf="displayValue && !dateInput.matches(':focus')">
        {{ displayValue }}
      </div>
      
      <mat-icon matSuffix>calendar_today</mat-icon>
      
      <!-- Error messages -->
      <mat-error *ngIf="showError && errorMessage">
        {{ errorMessage | translate }}
      </mat-error>
      
      <!-- Helper text showing expected format -->
      <mat-hint *ngIf="showFormatHint">
        {{ 'DATE.FORMAT' | translate }}: {{ dateFormatPattern }}
      </mat-hint>
    </mat-form-field>
  `,
  styles: [`
    .locale-datepicker {
      width: 100%;
    }
    
    .formatted-date-display {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      pointer-events: none;
      color: rgba(0, 0, 0, 0.87);
      background: white;
      padding: 0 4px;
      z-index: 1;
    }
    
    :host-context(.dark-theme) .formatted-date-display {
      background: #303030;
      color: rgba(255, 255, 255, 0.87);
    }
    
    input[type="date"]::-webkit-calendar-picker-indicator {
      opacity: 0;
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 24px;
      cursor: pointer;
    }
    
    input[type="date"]:focus + .formatted-date-display {
      display: none;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocaleDatepickerComponent),
      multi: true
    }
  ]
})
export class LocaleDatepickerComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() appearance: 'fill' | 'outline' = 'outline';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() minDate: string = '';
  @Input() maxDate: string = '';
  @Input() errorMessage: string = '';
  @Input() showError: boolean = false;
  @Input() showFormatHint: boolean = false;
  
  @Output() dateChange = new EventEmitter<Date | null>();
  
  private destroy$ = new Subject<void>();
  
  value: Date | null = null;
  isoValue: string = '';
  displayValue: string = '';
  dateFormatPattern: string = '';
  
  private onChange = (value: Date | null) => {};
  private onTouched = () => {};

  constructor(
    private localeDateService: LocaleDateService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.updateDateFormat();
    
    // Subscribe to locale changes
    this.localeDateService.currentLocale$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDateFormat();
        this.updateDisplayValue();
      });
    
    // Subscribe to language changes
    this.translationService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDateFormat();
        this.updateDisplayValue();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDateFormat(): void {
    this.dateFormatPattern = this.localeDateService.getDateFormat();
    if (!this.placeholder) {
      this.placeholder = this.localeDateService.getDatePlaceholder();
    }
  }

  private updateDisplayValue(): void {
    if (this.value) {
      this.displayValue = this.localeDateService.formatDate(this.value, 'medium');
    } else {
      this.displayValue = '';
    }
  }

  onDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const isoDateString = input.value;
    
    this.isoValue = isoDateString;
    
    if (isoDateString) {
      const date = this.localeDateService.parseDateFromInput(isoDateString);
      this.setValue(date);
    } else {
      this.setValue(null);
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  private setValue(date: Date | null): void {
    this.value = date;
    this.updateDisplayValue();
    this.onChange(date);
    this.dateChange.emit(date);
  }

  // ControlValueAccessor implementation
  writeValue(value: Date | string | null): void {
    if (value) {
      if (typeof value === 'string') {
        this.value = new Date(value);
      } else {
        this.value = value;
      }
      this.isoValue = this.localeDateService.formatDateForInput(this.value);
    } else {
      this.value = null;
      this.isoValue = '';
    }
    this.updateDisplayValue();
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
