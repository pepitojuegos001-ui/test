import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CurrencyService, CurrencyFormattingOptions } from '../services/currency.service';

@Pipe({
  name: 'appCurrency',
  pure: false // Make it impure to react to currency changes
})
export class AppCurrencyPipe implements PipeTransform, OnDestroy {
  private subscription?: Subscription;
  private lastValue?: any;
  private lastFormattedValue?: string;
  private lastOptions?: CurrencyFormattingOptions;

  constructor(
    private currencyService: CurrencyService,
    private cdr: ChangeDetectorRef
  ) {}

  transform(
    value: number | null | undefined, 
    options?: CurrencyFormattingOptions
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '';
    }

    // Check if we need to subscribe to currency changes
    if (!this.subscription) {
      this.subscription = this.currencyService.effectiveCurrency$.subscribe(() => {
        // Trigger change detection when currency changes
        this.lastFormattedValue = undefined;
        this.cdr.markForCheck();
      });
    }

    // Check if we can use cached value
    if (
      this.lastValue === value && 
      this.lastFormattedValue !== undefined &&
      this.optionsEqual(this.lastOptions, options)
    ) {
      return this.lastFormattedValue;
    }

    // Format the value
    this.lastValue = value;
    this.lastOptions = options;
    this.lastFormattedValue = this.currencyService.formatAmount(value, options);

    return this.lastFormattedValue;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private optionsEqual(
    options1?: CurrencyFormattingOptions, 
    options2?: CurrencyFormattingOptions
  ): boolean {
    if (!options1 && !options2) return true;
    if (!options1 || !options2) return false;

    return (
      options1.minimumFractionDigits === options2.minimumFractionDigits &&
      options1.maximumFractionDigits === options2.maximumFractionDigits &&
      options1.showSymbol === options2.showSymbol &&
      options1.useGrouping === options2.useGrouping
    );
  }
}
