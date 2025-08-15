# Currency Management System Implementation Guide

This document provides a comprehensive guide to the currency management system implemented in the Angular Financial Dashboard application.

## 🚀 Features Implemented

### 1. **Automatic Language-Based Currency Mapping**
- English → US Dollar (USD)
- Spanish → Argentine Peso (ARS)
- Portuguese → Brazilian Real (BRL)
- Italian → Euro (EUR)
- French → Euro (EUR)

### 2. **Manual Currency Override**
- Users can manually select any supported currency from user settings
- Manual selection overrides automatic language-based mapping
- Currency preference persists across sessions

### 3. **Reactive Currency Updates**
- All amounts automatically update when currency changes
- Real-time updates using RxJS observables
- No page refresh required

### 4. **Persistence & Authentication**
- Currency preferences stored in localStorage
- Per-user currency preferences for authenticated users
- Automatic loading on app initialization

## 🛠️ Technical Architecture

### Core Service: `CurrencyService`

```typescript
// Key methods and features:
class CurrencyService {
  // Observable streams for reactive updates
  currentCurrency$: Observable<string>
  effectiveCurrency$: Observable<Currency>
  
  // Language integration
  updateCurrencyForLanguage(languageCode: string): void
  
  // Manual currency selection
  setUserCurrency(currencyCode: string, username?: string): void
  clearUserCurrency(username?: string): void
  
  // Formatting
  formatAmount(amount: number, options?: CurrencyFormattingOptions): string
  formatAmountWithCurrency(amount: number, currency: Currency, options?): string
  
  // User management
  loadUserCurrencyPreference(username: string): void
  clearUserCurrencyPreferences(username?: string): void
}
```

### Currency Pipe: `AppCurrencyPipe`

```typescript
// Usage in templates:
{{ 1500 | appCurrency }}
{{ amount | appCurrency:{ minimumFractionDigits: 2 } }}
{{ value | appCurrency:{ showSymbol: false } }}
```

### Currency Selector Component

```html
<!-- In user settings -->
<app-currency-selector 
  [previewAmount]="1500"
  (currencyChanged)="onCurrencyChanged($event)">
</app-currency-selector>
```

## 📁 File Structure

```
src/app/
├── services/
│   └── currency.service.ts          # Core currency management
├── pipes/
│   └── currency.pipe.ts             # Template formatting pipe
├── components/
│   └── currency-selector/           # User settings currency selector
│       ├── currency-selector.component.ts
│       └── currency-selector.component.scss
└── assets/i18n/
    ├── en.json                      # English translations
    ├── es.json                      # Spanish translations
    └── ...                          # Other language files
```

## 🔧 Service Integration

### Translation Service Integration

```typescript
// Translation service automatically updates currency when language changes
setLanguage(languageCode: string): void {
  // ... language logic
  
  // Update currency based on language change
  if (this.currencyService) {
    this.currencyService.updateCurrencyForLanguage(languageCode);
  }
}
```

### Financial Data Service Integration

```typescript
// Financial data service uses currency service for formatting
formatCurrency(amount: number): string {
  if (this.currencyService) {
    return this.currencyService.formatAmount(amount);
  }
  // Fallback to USD formatting
}
```

## 💾 Data Persistence

### Storage Keys
- `financial_dashboard_currency` - Language-based currency
- `financial_dashboard_user_currency_default` - Anonymous user override
- `financial_dashboard_user_currency_{username}` - Authenticated user override

### Data Flow
1. **App Initialization**: Load saved preferences
2. **Language Change**: Auto-update currency (unless user override exists)
3. **Manual Selection**: Override automatic mapping
4. **User Login**: Load user-specific currency preferences

## 🎨 UI Components

### Currency Selector Features

```scss
// Key UI elements:
.currency-selector {
  // Dropdown with currency options
  // Preview section showing formatted examples
  // Reset to automatic button
  // Current currency status display
}
```

### Preview Examples
- Income example: Shows positive amount formatting
- Expense example: Shows negative amount formatting
- Real-time updates as user selects different currencies

## 🌐 Translation Keys

### English Translations (`en.json`)
```json
{
  "CURRENCY": {
    "PREFERRED_CURRENCY": "Preferred Currency",
    "SELECT_CURRENCY": "Select currency",
    "AUTO_BASED_ON_LANGUAGE": "Automatic (based on language)",
    "CURRENTLY": "Currently",
    "AUTO_HINT": "Currency is automatically set based on your language preference",
    "MANUAL_HINT": "You have manually selected a currency override",
    "PREVIEW": "Preview",
    "INCOME_EXAMPLE": "Income example",
    "EXPENSE_EXAMPLE": "Expense example",
    "RESET_TO_AUTO": "Reset to automatic"
  },
  "USER_SETTINGS": {
    "CURRENCY": "Currency",
    "CURRENCY_DESC": "Choose your preferred currency for displaying amounts",
    "CURRENT_CURRENCY": "Current currency",
    "CURRENCY_UPDATED": "Currency preference updated successfully!",
    "CURRENCY_AUTO_ENABLED": "Automatic currency selection enabled!"
  }
}
```

## 🔄 Usage Examples

### Template Usage

```html
<!-- Simple currency formatting -->
<div class="amount">{{ totalIncome | appCurrency }}</div>

<!-- With options -->
<div class="amount">
  {{ totalExpenses | appCurrency:{ minimumFractionDigits: 2, maximumFractionDigits: 2 } }}
</div>

<!-- Currency selector in settings -->
<app-currency-selector 
  [previewAmount]="1500"
  (currencyChanged)="onCurrencyChanged($event)">
</app-currency-selector>
```

### Component Usage

```typescript
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentCurrency?: Currency;

  constructor(private currencyService: CurrencyService) {}

  ngOnInit(): void {
    // Subscribe to currency changes
    this.currencyService.effectiveCurrency$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currency => {
        this.currentCurrency = currency;
        // React to currency changes
      });
  }

  onCurrencyChanged(currencyCode: string | null): void {
    // Handle currency selection from UI
    console.log('Currency changed to:', currencyCode);
  }

  formatCustomAmount(amount: number): string {
    return this.currencyService.formatAmount(amount, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
```

### Service Injection

```typescript
// In your component or service
constructor(
  private currencyService: CurrencyService,
  private translationService: TranslationService
) {}

// Check current currency
const currentCurrency = this.currencyService.getCurrentCurrency();
console.log(`Current currency: ${currentCurrency.name} (${currentCurrency.code})`);

// Format amount programmatically
const formatted = this.currencyService.formatAmount(1500);
console.log(`Formatted amount: ${formatted}`);
```

## 🎯 Best Practices

### 1. **Use the Pipe in Templates**
```html
<!-- ✅ Recommended -->
{{ amount | appCurrency }}

<!-- ❌ Avoid -->
{{ formatCurrency(amount) }}
```

### 2. **Subscribe to Currency Changes**
```typescript
// ✅ Reactive approach
this.currencyService.effectiveCurrency$.subscribe(currency => {
  // Update UI automatically
});

// ❌ Polling approach
setInterval(() => {
  const currency = this.currencyService.getCurrentCurrency();
}, 1000);
```

### 3. **Handle User Preferences Properly**
```typescript
// ✅ Consider authentication state
const currentUser = this.authService.getCurrentUser();
this.currencyService.setUserCurrency('EUR', currentUser?.username);

// ❌ Ignore user context
this.currencyService.setUserCurrency('EUR');
```

### 4. **Provide Fallbacks**
```typescript
// ✅ Graceful fallback
formatAmount(amount: number): string {
  if (this.currencyService) {
    return this.currencyService.formatAmount(amount);
  }
  return `$${amount.toLocaleString()}`;
}
```

## 🔧 Configuration Options

### Currency Formatting Options
```typescript
interface CurrencyFormattingOptions {
  minimumFractionDigits?: number;  // Default: 0
  maximumFractionDigits?: number;  // Default: 0
  showSymbol?: boolean;            // Default: true
  useGrouping?: boolean;           // Default: true
}
```

### Adding New Currencies
```typescript
// In currency.service.ts, add to availableCurrencies array:
{
  code: 'GBP',
  name: 'British Pound',
  symbol: '£',
  locale: 'en-GB',
  flag: 'assets/images/flags/gb.png'
}

// Add to language mapping if needed:
private readonly languageCurrencyMap: Record<string, string> = {
  'en-GB': 'GBP'  // British English → British Pound
};
```

## 🚀 Future Enhancements

### Potential Improvements
1. **Real-time Exchange Rates**: Integrate with currency API for live conversion
2. **Multiple Currency Display**: Show amounts in multiple currencies simultaneously
3. **Currency History**: Track currency preference changes
4. **Advanced Formatting**: Support for different number systems and locales
5. **Cryptocurrency Support**: Add support for digital currencies
6. **Bulk Currency Operations**: Apply currency changes to historical data

### Migration Guide
If upgrading from the old formatCurrency method:

```typescript
// Old approach
formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// New approach
{{ amount | appCurrency }}
// Or in component:
this.currencyService.formatAmount(amount)
```

This implementation provides a robust, scalable, and user-friendly currency management system that integrates seamlessly with the existing i18n infrastructure while providing powerful customization options for users.
